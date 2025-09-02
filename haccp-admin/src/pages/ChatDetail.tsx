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
  MenuItem,
  Skeleton
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Chat as ChatIcon
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
  const [otherUserProfile, setOtherUserProfile] = useState<{ photoURL?: string; displayName?: string; name?: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupInfoDialogOpen, setGroupInfoDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state) {
      const state = location.state as ChatInfo;
      setChatInfo(state);
      setDisplayName(state.name || 'Unknown User');
      setIsLoadingName(!state.name);
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

  // Timeout to stop loading name after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoadingName(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

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
        const userName = data.name || data.displayName || data.email || 'Unknown User';
        setOtherUserProfile({
          photoURL: data.photoURL,
          displayName: userName,
          name: userName,
        });
        // Update display name if it's still the default
        if (displayName === 'Unknown User' || !displayName) {
          setDisplayName(userName);
        }
        setIsLoadingName(false);
      }
    } catch (error) {
      console.error('Error fetching other user profile:', error);
      setIsLoadingName(false);
    }
  };

  const fetchGroupInfo = async () => {
    if (!chatId || !chatInfo?.companyCode) return;

    try {
      const groupDoc = await getDoc(doc(db, 'companies', chatInfo.companyCode, 'groups', chatId));
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        setGroupMembers(data.members || []);
        // Update display name with the actual group name from database
        if (data.name && data.name !== displayName) {
          setDisplayName(data.name);
        }
        setIsLoadingName(false);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setIsLoadingName(false);
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
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'grey.50',
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              borderRadius: 2,
              p: 2,
              mb: 3,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            }}
          >
            <ChatIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Loading Messages
          </Typography>
          <CircularProgress size={40} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Fetching conversation...
          </Typography>
        </Box>
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
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton 
            edge="start" 
            color="primary" 
            onClick={() => navigate('/admin/chat')}
            sx={{
              mr: { xs: 1, sm: 2 },
              bgcolor: 'grey.100',
              '&:hover': {
                bgcolor: 'grey.200',
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            <Avatar 
              src={chatInfo.type === 'direct' ? otherUserProfile?.photoURL : undefined}
              sx={{ 
                mr: { xs: 1.5, sm: 2 },
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                bgcolor: chatInfo.type === 'direct' ? 'secondary.main' : 'primary.main',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {chatInfo.type === 'direct' ? <PersonIcon /> : <GroupIcon />}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isLoadingName ? (
                  <Skeleton 
                    variant="text" 
                    width={120} 
                    height={24}
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  />
                ) : (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'text.primary',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName || chatInfo.name || 'Unknown User'}
                  </Typography>
                )}
                {chatInfo.type === 'direct' && chatInfo.otherUserId && (
                  <Box
                    sx={{
                      width: { xs: 6, sm: 8 },
                      height: { xs: 6, sm: 8 },
                      bgcolor: 'success.main',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      flexShrink: 0,
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 6px rgba(76, 175, 80, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                        },
                      },
                    }}
                  />
                )}
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {chatInfo.type === 'direct' ? 
                  (otherUserProfile ? 'Direct Message' : 'Loading...') : 
                  `${groupMembers.length} members`
                }
              </Typography>
            </Box>
          </Box>
          <IconButton 
            color="primary" 
            onClick={() => setGroupInfoDialogOpen(true)}
            sx={{
              bgcolor: 'grey.100',
              '&:hover': {
                bgcolor: 'grey.200',
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        bgcolor: 'grey.50',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(25, 118, 210, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(156, 39, 176, 0.05) 0%, transparent 50%)',
      }}>
        <List sx={{ p: 0 }}>
          {messages.length === 0 ? (
            <ListItem sx={{ py: 6 }}>
              <ListItemText
                primary={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ mb: 2, opacity: 0.5 }}>
                      💬
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No messages yet
                    </Typography>
                    <Typography color="text.secondary">
                      Start the conversation by sending a message!
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ) : (
            messages.map((message, index) => {
              const isOwn = isOwnMessage(message);
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
              
              return (
                <ListItem key={message.id} sx={{ display: 'block', mb: 0.5, px: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    {!isOwn && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          opacity: showAvatar ? 1 : 0,
                          transition: 'opacity 0.2s ease-in-out',
                          bgcolor: 'primary.main',
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )}
                    
                    <Box
                      sx={{
                        maxWidth: '70%',
                        minWidth: '120px',
                        position: 'relative',
                      }}
                    >
                      {!isOwn && showAvatar && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            mb: 0.5, 
                            ml: 1,
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          {message.senderName}
                        </Typography>
                      )}
                      
                      <Box
                        sx={{
                          bgcolor: isOwn ? 'primary.main' : 'white',
                          color: isOwn ? 'white' : 'text.primary',
                          borderRadius: isOwn 
                            ? '18px 18px 4px 18px' 
                            : '18px 18px 18px 4px',
                          p: 2,
                          boxShadow: isOwn 
                            ? '0 2px 8px rgba(25, 118, 210, 0.3)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.1)',
                          border: isOwn ? 'none' : '1px solid',
                          borderColor: 'divider',
                          position: 'relative',
                          '&::before': isOwn ? {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            right: -8,
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid',
                            borderLeftColor: 'primary.main',
                            borderTop: '8px solid transparent',
                            borderBottom: '8px solid transparent',
                          } : {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: -8,
                            width: 0,
                            height: 0,
                            borderRight: '8px solid',
                            borderRightColor: 'white',
                            borderTop: '8px solid transparent',
                            borderBottom: '8px solid transparent',
                          }
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                          }}
                        >
                          {message.text}
                        </Typography>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            mt: 1,
                            gap: 0.5,
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              opacity: 0.7,
                              fontSize: '0.7rem',
                            }}
                          >
                            {formatTime(message.timestamp)}
                          </Typography>
                          
                          {isOwn && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                              {message.status === 'read' && (
                                <Box sx={{ 
                                  color: 'rgba(76, 175, 80, 0.9)', 
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}>
                                  <Box sx={{ 
                                    display: 'flex',
                                    '& > *': { 
                                      fontSize: '0.6rem',
                                      lineHeight: 1,
                                    }
                                  }}>
                                    ✓✓
                                  </Box>
                                </Box>
                              )}
                              {message.status === 'delivered' && (
                                <Box sx={{ 
                                  color: 'rgba(255,255,255,0.8)', 
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}>
                                  <Box sx={{ 
                                    display: 'flex',
                                    '& > *': { 
                                      fontSize: '0.6rem',
                                      lineHeight: 1,
                                    }
                                  }}>
                                    ✓✓
                                  </Box>
                                </Box>
                              )}
                              {message.status === 'sent' && (
                                <Box sx={{ 
                                  color: 'rgba(255,255,255,0.6)', 
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}>
                                  <Box sx={{ 
                                    display: 'flex',
                                    '& > *': { 
                                      fontSize: '0.6rem',
                                      lineHeight: 1,
                                    }
                                  }}>
                                    ✓
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    {isOwn && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          opacity: 0,
                          transition: 'opacity 0.2s ease-in-out',
                        }}
                      />
                    )}
                  </Box>
                </ListItem>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        borderRadius: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 1 } }}>
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'grey.50',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            sx={{ 
              mb: 0.5,
              bgcolor: newMessage.trim() ? 'primary.main' : 'grey.300',
              color: newMessage.trim() ? 'white' : 'grey.500',
              '&:hover': {
                bgcolor: newMessage.trim() ? 'primary.dark' : 'grey.400',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
              transition: 'all 0.2s ease-in-out',
              boxShadow: newMessage.trim() ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <SendIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Group Info Dialog */}
      <Dialog open={groupInfoDialogOpen} onClose={() => setGroupInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Group Information</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {displayName || chatInfo.name || 'Unknown Chat'}
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
