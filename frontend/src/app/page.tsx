'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Drawer, Box, Typography, Button, Menu, MenuItem,
  TextField, IconButton, Toolbar, AppBar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const drawerWidth = 260;

export default function Home() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modelAnchorEl, setModelAnchorEl] = useState<null | HTMLElement>(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState<null | HTMLElement>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot'; table?: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const modelOpen = Boolean(modelAnchorEl);
  const roleOpen = Boolean(roleAnchorEl);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (!selectedRole) {
      alert('Please select a role before sending a message.');
      return;
    }

    const userMsg = { text: message, sender: 'user' as const };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    setTimeout(async () => {
      try {
        const response = await fetch('http://0.0.0.0:8000/query/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message, role: selectedRole, }),
        });

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data?.response,
            table: data.rag_response,
          }
        ]);
      } catch (error) {
        setMessages((prev) => [...prev, { sender: 'bot', text: '❌ Failed to fetch response.' }]);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderBotText = (text: string, table?: any[]) => (
    console.log('Table:', table),
    console.log('Text:', text.split('\n\n')),


    <>
      <Typography sx={{ whiteSpace: 'pre-line' }}>
        {text.split('\n\n').map((line, i) => (
          <span key={i} style={{ display: 'block', marginBottom: '1rem' }}>
            {line.includes('http') ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: line.replace(
                    /\[(.*?)\]\((.*?)\)/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                  ).replace(
                    /(?<!href=")(https?:\/\/[^\s]+)/g,
                    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
                  )
                }}
              />
            ) : (
              line
            )}
            <br />
          </span>
        ))}
      </Typography>

      {table && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Database</b></TableCell>
                <TableCell><b>Schema</b></TableCell>
                <TableCell><b>Table</b></TableCell>
                <TableCell><b>Description</b></TableCell>
                <TableCell><b>CVE</b></TableCell>
                <TableCell><b>Severity</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Link</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.Database}</TableCell>
                  <TableCell>{row.Schema}</TableCell>
                  <TableCell>{row.Table}</TableCell>
                  <TableCell>{row.Description}</TableCell>
                  <TableCell>{row.CVE}</TableCell>
                  <TableCell>{row.Severity}</TableCell>
                  <TableCell>{row.Status}</TableCell>
                  <TableCell>
                    <a href={row.Link} target="_blank" rel="noopener noreferrer">View</a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <img src='../../Assyst_Logo.png' alt='Assyst Logo' style={{ height: 60, padding: 6 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4a7637' }}>Ask Me</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', pt: '64px' }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              bgcolor: '#4a7637',
              color: '#fff',
              p: 2,
              pt: 3,
              top: '64px',
              height: 'calc(100% - 64px)',
              justifyContent: 'space-between',
            },
          }}
        >
          <div>
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ color: '#fff', borderColor: '#fff' }}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(e) => setModelAnchorEl(e.currentTarget)}
              >
                {selectedModel || 'LLM Model'}
              </Button>
              <Menu anchorEl={modelAnchorEl} open={modelOpen} onClose={() => setModelAnchorEl(null)}>
                {['Open AI', 'Mistral AI', 'LLaMA'].map((model) => (
                  <MenuItem
                    key={model}
                    selected={model === selectedModel}
                    onClick={() => {
                      setSelectedModel(model);
                      setModelAnchorEl(null);
                    }}
                  >
                    {model}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ color: '#fff', borderColor: '#fff' }}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(e) => setRoleAnchorEl(e.currentTarget)}
              >
                {selectedRole || 'Roles'}
              </Button>
              <Menu anchorEl={roleAnchorEl} open={roleOpen} onClose={() => setRoleAnchorEl(null)}>
                {['Cyber Risk Analyst', 'ISSO', 'CISO'].map((role) => (
                  <MenuItem
                    key={role}
                    selected={role === selectedRole}
                    onClick={() => {
                      setSelectedRole(role);
                      setRoleAnchorEl(null);
                    }}
                  >
                    {role}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </div>

          <div>
            <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637', mb: 1 }} onClick={() => setMessages([])}>Clear Chat</Button>
            <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637' }}>Report Error</Button>
          </div>
        </Drawer>

        {/* Chat Box */}
        <Box sx={{ flexGrow: 1, position: 'relative', pb: '120px', backgroundColor: '#f4f4f4' }}>
          <Box sx={{ maxWidth: '75%', mx: 'auto', mt: 4, p: 4, bgcolor: '#fff', borderRadius: '1rem', marginLeft: '20%' }}>
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6">Welcome to <b>Ask Me</b></Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Let’s get started!</Typography>
              </Box>
            )}
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ bgcolor: msg.sender === 'user' ? '#4a763724' : '#f1f1f1', px: 2, py: 1.5, borderRadius: '16px', maxWidth: '90%', my: 2 }}>
                  {msg.sender === 'bot' ? (
                    <>
                      {renderBotText(msg.text, msg.table)}
                    </>
                  ) : (
                    <Typography>{msg.text}</Typography>
                  )}
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 2, mb: 1 }}>
                <CircularProgress color="success" size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ position: 'fixed', bottom: 0, left: drawerWidth, right: 0, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0', px: 2, py: 1.5 }}>
            <Box sx={{ mx: 'auto', display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '24px', backgroundColor: '#fff', px: 2, marginLeft: '20%', maxWidth: '75%' }}>
              <TextField
                multiline
                maxRows={4}
                fullWidth
                placeholder="Send a message..."
                variant="standard"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                InputProps={{ disableUnderline: true, sx: { fontSize: '1rem' } }}
              />
              <IconButton onClick={handleSendMessage} sx={{ ml: 1 }}>
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
