'use client';
import { useEffect, useRef, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Menu, MenuItem,
  Box, TextField, InputAdornment, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function Home() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
  const [modelAnchorEl, setModelAnchorEl] = useState<null | HTMLElement>(null);
  const modelOpen = Boolean(modelAnchorEl);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModelClick = (event: React.MouseEvent<HTMLElement>) => {
    setModelAnchorEl(event.currentTarget);
  };

  const handleModelClose = () => {
    setModelAnchorEl(null);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMsg = { text: message, sender: 'user' as const };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');

    // Simulated bot response
    setTimeout(() => {
      const botReply = { text: `🤖 You said: "${message}"`, sender: 'bot' as const };
      setMessages((prev) => [...prev, botReply]);
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

  return (
    <Box sx={{ flexGrow: 1, pb: '120px' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src='../../Assyst_Logo.png' className='logo_wrapper' />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Button
                id="persona-button"
                aria-controls={open ? 'persona-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
              >
                Persona
              </Button>
              <Menu
                id="persona-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleClose}>Teacher</MenuItem>
                <MenuItem onClick={handleClose}>Professor</MenuItem>
                <MenuItem onClick={handleClose}>Analyst</MenuItem>
              </Menu>
            </Box>
            <Box>
              <Button
                id="model-button"
                aria-controls={modelOpen ? 'model-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={modelOpen ? 'true' : undefined}
                onClick={handleModelClick}
                endIcon={<KeyboardArrowDownIcon />}
              >
                LLM Model
              </Button>
              <Menu
                id="model-menu"
                anchorEl={modelAnchorEl}
                open={modelOpen}
                onClose={handleModelClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleModelClose}>GPT-4</MenuItem>
                <MenuItem onClick={handleModelClose}>GPT-3.5</MenuItem>
                <MenuItem onClick={handleModelClose}>Mistral</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Welcome and Messages */}
      <Box sx={{ maxWidth: '750px', mx: 'auto', mt: 4, p: 4, bgcolor: '#fff', borderRadius: '1rem' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, px: 2 }}>
          <Typography variant="h4" gutterBottom>💬</Typography>
          <Typography align="center" maxWidth="sm">
            Welcome to the <b>Assyst</b> Chatbot.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Let’s get started!
          </Typography>
        </Box>


        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: msg.sender === 'user' ? '#e6f4ea' : '#f1f1f1',
                px: 2,
                py: 1,
                borderRadius: '16px',
                maxWidth: '80%',
                fontSize: '0.95rem',
              }}
            >
              {msg.text}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Chat Input - Fixed Bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          bgcolor: '#f9f9f9',
          borderTop: '1px solid #e0e0e0',
          px: 2,
          py: 1.5,
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            minHeight: '100px',
            maxWidth: '720px',
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #ccc',
            borderRadius: '24px',
            backgroundColor: '#fff',
            px: 2,
            py: 0.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            '&:focus-within': {
              borderColor: '#888',
            },
          }}
        >
          <TextField
            multiline
            maxRows={4}
            fullWidth
            placeholder="Send a message..."
            variant="standard"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              disableUnderline: true,
              sx: { fontSize: '1rem', px: 1 },
            }}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={handleSendMessage} sx={{ ml: 1 }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
