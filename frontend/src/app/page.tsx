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
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchorEl);
  const modelOpen = Boolean(modelAnchorEl);
  const roleOpen = Boolean(roleAnchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleModelClick = (event: React.MouseEvent<HTMLElement>) => setModelAnchorEl(event.currentTarget);
  const handleModelClose = () => setModelAnchorEl(null);
  const handleRoleClick = (event: React.MouseEvent<HTMLElement>) => setRoleAnchorEl(event.currentTarget);
  const handleRoleClose = () => setRoleAnchorEl(null);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const userMsg = { text: message, sender: 'user' as const };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    setTimeout(async () => {
      try {
        const response = await fetch('http://0.0.0.0:8000/query/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message }),
        });

        const data = await response.json();
        const botReply = {
          text: data?.response?.replace(/\n/g, '\\n') || '🤖 I couldn’t find an answer.',
          sender: 'bot' as const,
        };
        setMessages((prev) => [...prev, botReply]);
      } catch (error) {
        setMessages((prev) => [...prev, {
          text: '❌ Failed to fetch response.',
          sender: 'bot' as const,
        }]);
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

  const renderBotMessage = (text: string) => {
    console.log('Bot message:', text);

    return text.split('\\n').map((line, i) => (
      <Typography key={i} variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
        {line.includes('http') ? (
          <span dangerouslySetInnerHTML={{ __html: line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#1a73e8;text-decoration:underline;">$1</a>') }} />
        ) : (
          line
        )}
      </Typography>
    ));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="relative" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <img src='../../Assyst_Logo.png' alt='Assyst Logo' style={{ height: 60, padding: 6 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4a7637' }}>Ask Me</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', pt: '64px' }}>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: '#4a7637',
              color: '#fff',
              p: 2,
              pt: 3,
              top: '64px',
              height: 'calc(100% - 64px)',
            },
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Button fullWidth variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }} endIcon={<KeyboardArrowDownIcon />} onClick={handleModelClick}>
              LLM Model
            </Button>
            <Menu anchorEl={modelAnchorEl} open={modelOpen} onClose={handleModelClose}>
              <MenuItem onClick={handleModelClose}>Open AI</MenuItem>
              <MenuItem onClick={handleModelClose}>Mistral AI</MenuItem>
              <MenuItem onClick={handleModelClose}>LLaMA</MenuItem>
            </Menu>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button fullWidth variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }} endIcon={<KeyboardArrowDownIcon />} onClick={handleRoleClick}>
              Roles
            </Button>
            <Menu anchorEl={roleAnchorEl} open={roleOpen} onClose={handleRoleClose}>
              <MenuItem onClick={handleRoleClose}>Cyber Risk Analyst</MenuItem>
              <MenuItem onClick={handleRoleClose}>ISSO</MenuItem>
              <MenuItem onClick={handleRoleClose}>CISO</MenuItem>
            </Menu>
          </Box>

          <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637', mb: 1 }} onClick={() => setMessages([])}>Clear Chat</Button>
          <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637' }}>Report Error</Button>
        </Drawer>

        <Box sx={{ flexGrow: 1, position: 'relative', pb: '120px', backgroundColor: '#f4f4f4', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Ctext x='0' y='150' font-size='160' fill='rgba(0, 102, 204, 0.06)' font-family='Arial, Helvetica, sans-serif' font-weight='bold'%3EAsk Me%3C/text%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(50% + 130px) center', backgroundSize: 'contain' }}>
          <Box sx={{ maxWidth: '750px', mx: 'auto', mt: 4, p: 4, bgcolor: '#fff', borderRadius: '1rem' }}>
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, px: 2 }}>
                <Typography align="center" maxWidth="sm" className='mb-8'>
                  Welcome to the <b>Ask Me</b>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Let’s get started!
                </Typography>
              </Box>
            )}

            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ bgcolor: msg.sender === 'user' ? '#e6f4ea' : '#f1f1f1', px: 2, py: 2, borderRadius: '16px', maxWidth: '80%', fontSize: '0.95rem', my: 1 }}>
                  {msg.sender === 'bot' ? renderBotMessage(msg.text) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{msg.text}</Typography>
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

          <Box sx={{ position: 'fixed', bottom: 0, left: drawerWidth, right: 0, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0', px: 2, py: 1.5, zIndex: 10 }}>
            <Box sx={{ maxWidth: '720px', mx: 'auto', display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '24px', backgroundColor: '#fff', px: 2, py: 0.5, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', '&:focus-within': { borderColor: '#888' } }}>
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
                sx={{ flex: 1 }}
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
