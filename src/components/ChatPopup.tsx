import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { AttachFile, Send } from "@mui/icons-material";

interface ChatPopupProps {
  onClose: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]); // Store chat messages

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      setMessages((prevMessages) => [...prevMessages, { text: message, isUser: true }]);
      console.log("Message sent:", message);
      setMessage(""); // Clear the input
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      console.log("File selected:", selectedFile.name);
    }
  };

  const handleFileSend = () => {
    if (file) {
      // Logic to send the file in the chat
      console.log("File sent:", file.name);
      setFile(null); // Reset file after sending
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Inject an incoming message every 2 seconds
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Hi", isUser: false }, // Incoming message
      ]);
    }, 2000);

    return () => clearInterval(interval); // Clean up interval on unmount
  }, []);

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px", boxShadow: 24 } }}>
      <DialogTitle sx={{ backgroundColor: "#6200ea", color: "#fff", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
        Chat
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: 0 }}>
        {/* Chat message display */}
        <Box
          sx={{
            height: '300px',
            overflowY: 'scroll',
            mb: 2,
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderColor: '#e0e0e0',
            display: 'flex',
            flexDirection: 'column-reverse', // Reverse order to show latest messages at the bottom
          }}
        >
          {messages.length > 0 ? (
            messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.isUser ? '#e3f2fd' : '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  margin: '5px 0',
                  maxWidth: '80%',
                  boxShadow: 1,
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
          )}
        </Box>

        <Divider sx={{ marginBottom: 2 }} />

        {/* Chat message input */}
        <TextField
          autoFocus
          margin="dense"
          label="Type your message"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '& fieldset': {
                borderColor: '#6200ea',
              },
              '&:hover fieldset': {
                borderColor: '#3700b3',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#03dac6',
              },
            },
          }}
        />

        {/* File upload button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <input
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <IconButton color="primary" aria-label="upload file" component="span">
              <AttachFile />
            </IconButton>
          </label>
          {file && <Typography variant="body2" sx={{ marginLeft: 1 }}>{file.name}</Typography>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleSendMessage}
          color="primary"
          variant="contained"
          endIcon={<Send />}
          sx={{ borderRadius: '20px' }}
        >
          Send Message
        </Button>
        {file && (
          <Button
            onClick={handleFileSend}
            color="secondary"
            variant="contained"
            sx={{ borderRadius: '20px' }}
          >
            Send File
          </Button>
        )}
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderRadius: '20px' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatPopup;
