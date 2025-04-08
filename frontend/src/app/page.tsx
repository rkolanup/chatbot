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
  const [messages, setMessages] = useState<
    ({ text: string; sender: 'user' | 'bot'; type?: 'text' } |
    { sender: 'bot'; type: 'table'; data: { database: string; schema: string; table: string; description: string; link: string }[] })[]
  >([]);
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
    const userMsg = { text: message, sender: 'user' as const, type: 'text' as const };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    const parseVulnerabilityList = (raw: string) => {
      console.log('Raw response:', raw);
      const entries = raw.split(/\n(?=\d+\.\s+Database:)/);
      return entries.map((entry) => {
        const dbMatch = entry.match(/Database:\s*(.+)/i);
        const schemaMatch = entry.match(/Schema:\s*(.+)/i);
        const tableMatch = entry.match(/Table:\s*(.+)/i);
        const descMatch = entry.match(/Description:\s*(.+)/i);
        const linkMatch = entry.match(/\[Link\]\((https?:\/\/[^)]+)\)/i);

        if (dbMatch && schemaMatch && tableMatch && descMatch && linkMatch) {
          return {
            database: dbMatch[1].trim(),
            schema: schemaMatch[1].trim(),
            table: tableMatch[1].trim(),
            description: descMatch[1].trim(),
            link: linkMatch[1].trim(),
          };
        }
        return null;
      }).filter(Boolean) as any[];
    };

    setTimeout(async () => {
      try {
        const response = await fetch('http://0.0.0.0:8000/query/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message, role: selectedRole, }),
        });

        const data = await response.json();
        const responseText = data?.response || 'I couldn’t find an answer.';

        const parsedData = parseVulnerabilityList(responseText);
        console.log('Parsed table data:', parsedData);

        if (/Database:\s/.test(responseText) && /Table:\s/.test(responseText)) {

          setMessages((prev) => [...prev, { sender: 'bot', type: 'table', data: responseText }]);
        } else {
          setMessages((prev) => [...prev, { sender: 'bot', type: 'text', text: responseText }]);
        }
      } catch (error) {
        setMessages((prev) => [...prev, { sender: 'bot', type: 'text', text: '❌ Failed to fetch response.' }]);
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

  const renderBotText = (text: string) => (
    <Typography sx={{ whiteSpace: 'pre-line' }}>
      {text.split('\n').map((line, i) => (
        <span key={i}>
          {line.includes('http') ? (
            <span
              dangerouslySetInnerHTML={{
                __html: line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
              }}
            />
          ) : (
            line
          )}
          <br />
        </span>
      ))}
    </Typography>
  );

  const renderTable = (data: any[]) => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><b>Database</b></TableCell>
            <TableCell><b>Schema</b></TableCell>
            <TableCell><b>Table</b></TableCell>
            <TableCell><b>Description</b></TableCell>
            <TableCell><b>More Info</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.database}</TableCell>
              <TableCell>{row.schema}</TableCell>
              <TableCell>{row.table}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell><a href={row.link} target="_blank" rel="noopener noreferrer">Link</a></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <img src='../../Assyst_Logo.png' alt='Assyst Logo' style={{ height: 60, padding: 6 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4a7637' }}>Ask Me</Typography>
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
            },
          }}
        >
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

          <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637', mb: 1 }} onClick={() => setMessages([])}>Clear Chat</Button>
          <Button fullWidth variant="contained" sx={{ bgcolor: '#fff', color: '#4a7637' }}>Report Error</Button>
        </Drawer>

        {/* Chat Box */}
        <Box sx={{ flexGrow: 1, position: 'relative', pb: '120px', backgroundColor: '#f4f4f4' }}>
          <Box sx={{ maxWidth: '750px', mx: 'auto', mt: 4, p: 4, bgcolor: '#fff', borderRadius: '1rem' }}>
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6">Welcome to <b>Ask Me</b></Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Let’s get started!</Typography>
              </Box>
            )}
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ bgcolor: msg.sender === 'user' ? '#4a763724' : '#f1f1f1', px: 2, py: 1.5, borderRadius: '16px', maxWidth: '80%', my: 2 }}>
                  {msg.sender === 'bot' && msg.type === 'text' && renderBotText(msg.text)}
                  {msg.sender === 'bot' && msg.type === 'table' && renderTable(msg.data)}
                  {msg.sender === 'user' && <Typography>{msg.text}</Typography>}
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
            <Box sx={{ maxWidth: '720px', mx: 'auto', display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '24px', backgroundColor: '#fff', px: 2 }}>
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
