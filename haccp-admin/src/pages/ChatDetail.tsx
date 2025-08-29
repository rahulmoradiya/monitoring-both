import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  AppBar,
  Toolbar,
  Badge,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, doc, addDoc, onSnapshot, orderBy, query, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  attachments?: Attachment[];
  status: 'sent' | 'delivered' | 'read';
}

interface Attachment {
  type: 'image' | 'document';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface ChatInfo {
  type: 'direct' | 'group';
  name: string;
  otherUserId?: string;
  companyCode: string;
}

export default function ChatDetail() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<{ photoURL?: string; displayName?: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupInfoDialogOpen, setGroupInfoDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state) {
      setChatInfo(location.state as ChatInfo);
    }
  }, [location.state]);

  useEffect(() => {
    if (chatId && chatInfo?.companyCode) {
      loadMessages();
      if (chatInfo.type === 'direct' && chatInfo.otherUserId) {
        fetchOtherUserProfile();
      } else if (chatInfo.type === 'group') {
        fetchGroupInfo();
      }
    }
  }, [chatId, chatInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    if (!chatId || !chatInfo?.companyCode) return;

    const messagesRef = collection(db, 'companies', chatInfo.companyCode, chatInfo.type === 'direct' ? 'conversations' : 'groups', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          attachments: data.attachments || [],
          status: data.status || 'sent',
        });
      });
      
      setMessages(loadedMessages);
      setLoading(false);
      markMessagesAsRead();
    });

    return () => unsubscribe();
  };

  const fetchOtherUserProfile = async () => {
    if (!chatInfo?.companyCode || !chatInfo.otherUserId) return;

    try {
      const userDoc = await getDoc(doc(db, 'companies', chatInfo.companyCode, 'users', chatInfo.otherUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setOtherUserProfile({
          photoURL: data.photoURL,
          displayName: data.name || data.displayName,
        });
      }
    } catch (error) {
      console.error('Error fetching other user profile:', error);
    }
  };

  const fetchGroupInfo = async () => {
    if (!chatId || !chatInfo?.companyCode) return;

    try {
      const groupDoc = await getDoc(doc(db, 'companies', chatInfo.companyCode, 'groups', chatId));
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        setGroupMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUser || !chatId || !chatInfo?.companyCode) return;

    try {
      const chatRef = doc(db, 'companies', chatInfo.companyCode, chatInfo.type === 'direct' ? 'conversations' : 'groups', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${currentUser.uid}`]: 0,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatId || !chatInfo?.companyCode) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || 'Unknown User',
        timestamp: serverTimestamp(),
        status: 'sent',
      };

      const messagesRef = collection(db, 'companies', chatInfo.companyCode, chatInfo.type === 'direct' ? 'conversations' : 'groups', chatId, 'messages');
      await addDoc(messagesRef, messageData);

      // Update chat metadata
      const chatRef = doc(db, 'companies', chatInfo.companyCode, chatInfo.type === 'direct' ? 'conversations' : 'groups', chatId);
      await updateDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.displayName || currentUser.email || 'Unknown User',
        [`unreadCount.${currentUser.uid}`]: 0,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUser?.uid;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chatInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Chat information not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/chat')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar 
              src={chatInfo.type === 'direct' ? otherUserProfile?.photoURL : undefined}
              sx={{ mr: 2 }}
            >
              {chatInfo.type === 'direct' ? <PersonIcon /> : <GroupIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {chatInfo.name}
              </Typography>
              <Typography variant="caption" color="inherit">
                {chatInfo.type === 'direct' ? 'Direct Message' : 'Group Chat'}
              </Typography>
            </Box>
          </Box>
          <IconButton color="inherit" onClick={() => setGroupInfoDialogOpen(true)}>
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        <List>
          {messages.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary" align="center">
                    No messages yet. Start the conversation!
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            messages.map((message, index) => (
              <ListItem key={message.id} sx={{ display: 'block', mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: isOwnMessage(message) ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      bgcolor: isOwnMessage(message) ? 'primary.main' : 'white',
                      color: isOwnMessage(message) ? 'white' : 'text.primary',
                      borderRadius: 2,
                      p: 2,
                      boxShadow: 1,
                    }}
                  >
                    {!isOwnMessage(message) && (
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8 }}>
                        {message.senderName}
                      </Typography>
                    )}
                    <Typography variant="body1">{message.text}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            ))
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            sx={{ mb: 0.5 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Group Info Dialog */}
      <Dialog open={groupInfoDialogOpen} onClose={() => setGroupInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Group Information</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {chatInfo.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {chatInfo.type === 'group' ? 'Group Chat' : 'Direct Message'}
          </Typography>
          {chatInfo.type === 'group' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Members ({groupMembers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {groupMembers.map((memberId) => (
                  <Chip
                    key={memberId}
                    label={memberId === currentUser?.uid ? 'You' : memberId}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
