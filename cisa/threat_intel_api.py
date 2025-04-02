from fastapi import FastAPI, File, UploadFile, HTTPException
import pandas as pd
import faiss
import numpy as np
import openai
import os
import json
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables and set OpenAI API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = FastAPI()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize FAISS index
embedding_dim = 3072 # Adjust based on OpenAI embedding model
index = faiss.IndexFlatL2(embedding_dim)
db_metadata = []  # List to store metadata for each record

# Function to generate an embedding from text using OpenAI
def get_embedding(text: str):
    response = client.embeddings.create(
        model="text-embedding-3-large",  # Update model if needed (e.g., "text-embedding-ada-002")
        input=text
    )  
    return response.data[0].embedding

# New endpoint to upload a CSV or XLSX file and index it into FAISS
@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Ensure the file pointer is at the beginning
        file.file.seek(0)
        
        # Read file based on its extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Please upload a CSV or XLSX file."
            )
        
        # Validate required columns exist
        if "Database" not in df.columns or "Description" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file must contain 'Database' and 'Description' columns."
            )
        
        embeddings = []
        for _, row in df.iterrows():
            # Compute embedding for the description
            embedding = get_embedding(row["Description"])
            embeddings.append(embedding)
            
            # Save metadata; include additional columns if available
            db_metadata.append({
                "Database": row["Database"],
                "Description": row["Description"],
                "Schema": row.get("Schema", ""),
                "Table": row.get("Table", ""),
                "Link": row.get("Link", "")
            })
        # Convert embeddings list to NumPy array and add to the FAISS index
        embeddings_np = np.array(embeddings).astype('float32')
        index.add(embeddings_np)
        
        return {"message": f"Successfully loaded {len(embeddings)} records into FAISS."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pydantic model for query input
class QueryRequest(BaseModel):
    query: str

# Endpoint to handle queries using the FAISS index
@app.post("/query/")
async def query_direct(data: QueryRequest):
    try:
        # Ensure that metadata exists (i.e. a file has been uploaded and processed)
        if not db_metadata:
            raise HTTPException(
                status_code=400,
                detail="No database metadata available. Please upload a file first."
            )
        
        # Format the catalog text from the stored metadata
        catalog_text = "\n\n".join(
            f"Database: {item['Database']}\nSchema: {item.get('Schema', '')}\nTable: {item.get('Table', '')}\nDescription: {item['Description']}\nLink: {item.get('Link', '')}"
            for item in db_metadata
        )
        
        # Build the prompt for GPT-4
        prompt = f"""
        You are a database catalog assistant. Use the provided database NAME AND DESCRIPTION to answer queries.
        If the query matches a database, description, schema, or table, provide relevant details.
        If it does not match anything, respond with "I am sorry, the database you are looking for does not exist."

        Here is the database catalog:

        {catalog_text}

        Query: {data.query}
        """
        
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AI assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return {"response": gpt_response.choices[0].message.content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the API
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
