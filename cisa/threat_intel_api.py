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
metadata_filename = "metadata.json"
model_name = 'all-MiniLM-L6-v2'
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = FastAPI()
index_filename = "my_faiss_index.index"

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
# n_clusters = 100
index = faiss.IndexFlatL2(embedding_dim)    
# index = faiss.IndexIVFFlat(quantizer, embedding_dim, n_clusters, faiss.METRIC_L2)
db_metadata = []  # List to store metadata for each record

# Function to generate an embedding from text using OpenAI
def get_embedding(text: str):
    response = client.embeddings.create(
        model="text-embedding-3-large",  # Update model if needed (e.g., "text-embedding-ada-002")
        input=text
    )  
    return response.data[0].embedding

@app.get("/home/")
async def home():
    try:        
        return {"message": f"Threat Intelligence API up and running."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint to upload a CSV or XLSX file and index it into FAISS
@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...)):
    try:
        breakpoint()
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
                "Link": row.get("Link", ""),
                "CVE_ID" : row.get("CVE_ID", ""),
                "Severity" : row.get("Severity", ""),
                "Status" : row.get("Status", "")
            })
        # Convert embeddings list to NumPy array and add to the FAISS index
        # Save metadata to a JSON file
        with open(metadata_filename, 'w') as f:
            json.dump(db_metadata, f)
        embeddings_np = np.array(embeddings).astype('float32')
        index.add(embeddings_np)    
        faiss.write_index(index, index_filename) 
        
        return {"message": f"Successfully loaded {len(embeddings)} records into FAISS."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pydantic model for query input
class QueryRequest(BaseModel):
    query: str
    role: str

# Endpoint to handle queries using the FAISS index
@app.post("/query/")
async def query_direct(data: QueryRequest):
    try:
        local_index = faiss.read_index(index_filename)
        # Format the catalog text from the stored metadata
        local_db_metadata = json.load(open(metadata_filename))
        query_vectors = get_embedding(data.query)
        encoded_vectors = np.array([query_vectors]).astype('float32')
        distances, indices= local_index.search(encoded_vectors, 5)
        most_accurate_data = []
        for i in range(0,5):
            most_accurate_data.append(local_db_metadata[indices[0][i]])
        catalog_text = "\n\n".join(
            f"Database: {item['Database']}\nSchema: {item.get('Schema', '')}\nTable: {item.get('Table', '')}\nDescription: {item['Description']}\nLink: {item.get('Link', '')}\nCVE: {item.get('CVE_ID', '')}\nSeverity: {item.get('Severity', '')}\nStatus: {item.get('Status', '')}\n"
            for item in most_accurate_data
        )
        
        # Build the prompt for GPT-4
        prompt = f"""
        Role asking the query: {data.role}
        You are an assistant. Use the provided database name or description or any column names (Cve for example) to answer queries. Don't rely just on the database names clients give you.
        Use any related information in the training data to provide relevant details.
        If the query matches a database, description, schema, or table, or any related info (cve for example) in the training data provide relevant details.
        Always provide data in the format: Database: <database name>, Schema: <schema name>, Table: <table name>, Description: <description>, Link: <link>, Severity: <severity>, Status: <status>.
        Provide a high-level summary along with the data format in a paragraph starting with 'As a {data.role}'.
        If it does not match anything, respond with "I am sorry, the database you are looking for does not exist.
        Please make sure to make your response human-readable and concise."

        Here is the database catalog:

        {catalog_text}

        Query: {data.query}
        """
        
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "You are an AI assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return {"response": gpt_response.choices[0].message.content}
    
    except Exception as e:
        #breakpoint()
        raise HTTPException(status_code=500, detail=str(e))

# Run the API
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
