import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Skeleton,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Circle as CircleIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface ChatItem {
  id: string;
  type: 'direct' | 'group';
  name: string;
  lastMessage: string;
  lastMessageTime: any;
  lastMessageSender?: string;
  unreadCount?: number;
  participants?: string[];
  members?: string[];
  otherUserId?: string;
  memberCount?: number;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: any;
}

interface User {
  uid: string;
  name: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

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

export default function Chat() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    selectedUsers: [] as string[]
  });

  // Chat detail state
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState<{ photoURL?: string; displayName?: string; name?: string } | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(false);
  const [showChatDetail, setShowChatDetail] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanyCode = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const usersSnap = await getDocs(collection(db, 'companies'));
        for (const companyDoc of usersSnap.docs) {
          const usersCol = await getDocs(collection(db, 'companies', companyDoc.id, 'users'));
          const userDoc = usersCol.docs.find(doc => doc.data().uid === currentUser.uid);
          if (userDoc) {
            setCompanyCode(companyDoc.id);
            break;
          }
        }
        // If no company found, still set loading to false
        if (!companyCode) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching company code:', error);
        setLoading(false);
      }
    };
    fetchCompanyCode();
  }, [currentUser]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (companyCode) {
      fetchUsers();
    }
  }, [companyCode]);

  useEffect(() => {
    if (companyCode && currentUser) {
      setupChatListeners();
    }
  }, [companyCode, currentUser]);

  // Update chat items when allUsers changes (to refresh names)
  useEffect(() => {
    if (allUsers.length > 0 && chatItems.length > 0) {
      // Refresh chat items to update names with newly loaded user data
      const updatedChatItems = chatItems.map(chatItem => {
        if (chatItem.type === 'direct' && chatItem.otherUserId) {
          const otherUser = allUsers.find(u => u.uid === chatItem.otherUserId);
          if (otherUser && (otherUser.name || otherUser.email)) {
            const newName = otherUser.name || otherUser.email || chatItem.name;
            if (newName !== chatItem.name) {
              return { ...chatItem, name: newName, photoURL: otherUser.photoURL };
            }
          }
        }
        return chatItem;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedChatItems.some((item, index) => 
        item.name !== chatItems[index].name || item.photoURL !== chatItems[index].photoURL
      );
      
      if (hasChanges) {
        setChatItems(updatedChatItems);
      }
    }
  }, [allUsers]);

  const fetchUsers = async () => {
    if (!companyCode) return;
    
    try {
      const usersSnap = await getDocs(collection(db, 'companies', companyCode, 'users'));
      const users = usersSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setAllUsers(users);
      
      // Track online status for all users
      trackOnlineStatus(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const trackOnlineStatus = (users: User[]) => {
    // For now, we'll simulate online status based on recent activity
    // In a real app, you'd use Firebase presence or real-time status updates
    const online = new Set<string>();
    
    // Add current user as online
    if (currentUser) {
      online.add(currentUser.uid);
    }
    
    // Simulate some users as online (you can replace this with real presence tracking)
    users.forEach(user => {
      if (user.uid !== currentUser?.uid && Math.random() > 0.5) {
        online.add(user.uid);
      }
    });
    
    setOnlineUsers(online);
  };

  const setupChatListeners = () => {
    if (!companyCode || !currentUser) return;

    let conversations: ChatItem[] = [];
    let groups: ChatItem[] = [];

    const updateChatItems = () => {
      const allChats = [...conversations, ...groups];
      allChats.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis();
      });
      setChatItems(allChats);
      setLoading(false);
    };

    // Listen to direct conversations
    const conversationsQuery = query(
      collection(db, 'companies', companyCode, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const conversationsUnsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const byPairKey = new Map<string, any>();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as any;
        const otherParticipant = (data.participants || []).find((p: string) => p !== currentUser.uid);
        if (!otherParticipant) return;

        const pairKey = (data.participantsKey as string) || [currentUser.uid, otherParticipant].sort().join('_');

        const otherUser = allUsers.find(u => u.uid === otherParticipant);
        
        // Enhanced name resolution with better fallbacks
        let displayName = 'Unknown User';
        if (data.participantNames && data.participantNames[otherParticipant]) {
          displayName = data.participantNames[otherParticipant];
        } else if (otherUser?.name) {
          displayName = otherUser.name;
        } else if (otherUser?.displayName) {
          displayName = otherUser.displayName;
        } else if (otherUser?.email) {
          displayName = otherUser.email;
        } else {
          // Fallback: if we can't find the other user's name, show a truncated user ID
          displayName = `User ${otherParticipant.substring(0, 8)}...`;
        }
        
        // Debug logging to help identify the issue
        if (displayName === 'Unknown User' || displayName.includes('User ')) {
          console.log('Name resolution debug:', {
            otherParticipant,
            participantNames: data.participantNames,
            otherUser: otherUser ? { name: otherUser.name, email: otherUser.email } : null,
            allUsersCount: allUsers.length,
            displayName
          });
        }
        
        const candidate = {
          id: docSnap.id,
          type: 'direct' as const,
          name: displayName,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          lastMessageSender: data.lastMessageSender,
          unreadCount: (data.unreadCount && data.unreadCount[currentUser.uid]) || 0,
          otherUserId: otherParticipant,
          participants: data.participants,
          photoURL: otherUser?.photoURL,
        };

        const existing = byPairKey.get(pairKey);
        if (!existing) {
          byPairKey.set(pairKey, candidate);
        } else {
          const a = existing.lastMessageTime?.toMillis?.() || 0;
          const b = candidate.lastMessageTime?.toMillis?.() || 0;
          if (b >= a) byPairKey.set(pairKey, candidate);
        }
      });

      conversations = Array.from(byPairKey.values());
      setLoadingChats(false);
      updateChatItems();
    });

    // Listen to groups
    const groupsQuery = query(
      collection(db, 'companies', companyCode, 'groups'),
      where('members', 'array-contains', currentUser.uid)
    );

    const groupsUnsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      groups = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'group' as const,
          name: data.name || 'Unnamed Group',
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          lastMessageSender: data.lastMessageSender,
          unreadCount: (data.unreadCount && data.unreadCount[currentUser.uid]) || 0,
          members: data.members || [],
          memberCount: (data.members || []).length,
          photoURL: data.photoURL,
        };
      });
      updateChatItems();
    });

    return () => {
      conversationsUnsubscribe();
      groupsUnsubscribe();
    };
  };

  const handleChatClick = (chatItem: ChatItem) => {
    setSelectedChat(chatItem);
    setDisplayName(chatItem.name);
    setIsLoadingName(false);
    setShowChatDetail(true);
    
    // Load messages for the selected chat
    loadMessages(chatItem);
    
    // Load user/group info
    if (chatItem.type === 'direct' && chatItem.otherUserId) {
      fetchOtherUserProfile(chatItem.otherUserId);
    } else if (chatItem.type === 'group') {
      fetchGroupInfo(chatItem.id);
    }
  };

  const startNewDirectChat = async (otherUserId: string) => {
    if (!companyCode || !currentUser) return;

    try {
      const otherUser = allUsers.find(u => u.uid === otherUserId);
      if (!otherUser) return;

      const pairKey = [currentUser.uid, otherUserId].sort().join('_');
      const conversationsRef = collection(db, 'companies', companyCode, 'conversations');

      // Check if conversation already exists
      const existingQ = query(
        conversationsRef,
        where('participantsKey', '==', pairKey)
      );
      let existingSnap = await getDocs(existingQ);

      let chatId: string;
      if (existingSnap.empty) {
        // Create new conversation
        const conversationData = {
          participants: [currentUser.uid, otherUserId],
          participantsKey: pairKey,
          participantNames: {
            [currentUser.uid]: currentUser.displayName || currentUser.email,
            [otherUserId]: otherUser.name,
          },
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          lastMessageSender: '',
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 0,
          },
          createdAt: serverTimestamp(),
        };
        const newDocRef = await addDoc(conversationsRef, conversationData);
        chatId = newDocRef.id;
      } else {
        chatId = existingSnap.docs[0].id;
      }

      // Navigate to chat
      navigate(`/admin/chat/${chatId}`, {
        state: {
          type: 'direct',
          chatName: otherUser.name,
          otherUserId: otherUserId,
          companyCode
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const createNewGroup = async () => {
    if (!companyCode || !currentUser) return;

    try {
      const groupData = {
        name: newGroupData.name,
        description: newGroupData.description,
        members: [currentUser.uid, ...newGroupData.selectedUsers],
        memberNames: {
          [currentUser.uid]: currentUser.displayName || currentUser.email,
          ...Object.fromEntries(
            newGroupData.selectedUsers.map(uid => {
              const user = allUsers.find(u => u.uid === uid);
              return [uid, user?.name || 'Unknown User'];
            })
          )
        },
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSender: '',
        unreadCount: Object.fromEntries(
          [currentUser.uid, ...newGroupData.selectedUsers].map(uid => [uid, 0])
        ),
      };

      const groupRef = await addDoc(collection(db, 'companies', companyCode, 'groups'), groupData);
      
      setNewGroupDialogOpen(false);
      setNewGroupData({ name: '', description: '', selectedUsers: [] });
      
      // Create a new chat item and select it
      const newChatItem: ChatItem = {
        id: groupRef.id,
        type: 'group',
        name: newGroupData.name,
        lastMessage: '',
        lastMessageTime: null,
        members: [currentUser.uid, ...newGroupData.selectedUsers],
        memberCount: newGroupData.selectedUsers.length + 1,
      };
      
      handleChatClick(newChatItem);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Chat detail functions
  const loadMessages = (chatItem: ChatItem) => {
    if (!chatItem || !companyCode) return;

    const messagesRef = collection(db, 'companies', companyCode, chatItem.type === 'direct' ? 'conversations' : 'groups', chatItem.id, 'messages');
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
      markMessagesAsRead(chatItem);
    });

    return () => unsubscribe();
  };

  const fetchOtherUserProfile = async (otherUserId: string) => {
    if (!companyCode || !otherUserId) return;

    try {
      const userDoc = await getDoc(doc(db, 'companies', companyCode, 'users', otherUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Enhanced name resolution with multiple fallbacks
        const userName = data.name || 
                        data.displayName || 
                        data.email || 
                        `User ${otherUserId.substring(0, 8)}...`;
        
        setOtherUserProfile({
          photoURL: data.photoURL,
          displayName: userName,
          name: userName,
        });
        setDisplayName(userName);
      } else {
        // If user document doesn't exist, try to find in allUsers
        const userFromCache = allUsers.find(u => u.uid === otherUserId);
        if (userFromCache) {
          const userName = userFromCache.name || 
                          userFromCache.email || 
                          `User ${otherUserId.substring(0, 8)}...`;
          setOtherUserProfile({
            photoURL: userFromCache.photoURL,
            displayName: userName,
            name: userName,
          });
          setDisplayName(userName);
        } else {
          // Final fallback
          const fallbackName = `User ${otherUserId.substring(0, 8)}...`;
          setOtherUserProfile({
            displayName: fallbackName,
            name: fallbackName,
          });
          setDisplayName(fallbackName);
        }
      }
    } catch (error) {
      console.error('Error fetching other user profile:', error);
      // Set fallback name on error
      const fallbackName = `User ${otherUserId.substring(0, 8)}...`;
      setDisplayName(fallbackName);
    }
  };

  const fetchGroupInfo = async (groupId: string) => {
    if (!companyCode || !groupId) return;

    try {
      const groupDoc = await getDoc(doc(db, 'companies', companyCode, 'groups', groupId));
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        setGroupMembers(data.members || []);
        if (data.name && data.name !== displayName) {
          setDisplayName(data.name);
        }
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
    }
  };

  const markMessagesAsRead = async (chatItem: ChatItem) => {
    if (!currentUser || !chatItem || !companyCode) return;

    try {
      const chatRef = doc(db, 'companies', companyCode, chatItem.type === 'direct' ? 'conversations' : 'groups', chatItem.id);
      await updateDoc(chatRef, {
        [`unreadCount.${currentUser.uid}`]: 0,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedChat || !companyCode) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || 'Unknown User',
        timestamp: serverTimestamp(),
        status: 'sent',
      };

      const messagesRef = collection(db, 'companies', companyCode, selectedChat.type === 'direct' ? 'conversations' : 'groups', selectedChat.id, 'messages');
      await addDoc(messagesRef, messageData);

      // Update chat metadata
      const chatRef = doc(db, 'companies', companyCode, selectedChat.type === 'direct' ? 'conversations' : 'groups', selectedChat.id);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredChatItems = chatItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 2, sm: 3 },
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
            Loading Chat
          </Typography>
          <CircularProgress size={40} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Fetching your conversations...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Check if there's no data
  const hasNoData = chatItems.length === 0 && allUsers.length === 0;

  if (hasNoData) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Chat
            </Typography>
          </Box>
        </Box>

        {/* No Data Message */}
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" sx={{ color: 'text.secondary', mb: 2 }}>
              💬
            </Typography>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
              Welcome to Chat!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This is your first time here. The chat system will be available once you have team members and start conversations. You'll be able to create group chats and have direct conversations with your team.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              To get started with chat:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Add team members in the "Teams Management" section
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Create group chats for different departments or projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Start direct conversations with individual team members
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Share updates, ask questions, and collaborate in real-time
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Left Sidebar - Chat List */}
      <Box sx={{ 
        width: { xs: showChatDetail ? 0 : '100%', md: showChatDetail ? '350px' : '100%' },
        minWidth: { md: showChatDetail ? '350px' : 'auto' },
        maxWidth: { md: showChatDetail ? '400px' : 'none' },
        display: 'flex',
        flexDirection: 'column',
        borderRight: { md: showChatDetail ? '1px solid' : 'none' },
        borderColor: 'divider',
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  p: 1.5,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                }}
              >
                <ChatIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                }}
              >
                Chat
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewGroupDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                },
                fontSize: '0.875rem',
              }}
            >
              New
            </Button>
          </Box>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
        </Box>

        {/* Chat List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List sx={{ p: 0 }}>
            {loadingChats ? (
              // Skeleton loading for chat items
              Array.from({ length: 5 }).map((_, index) => (
                <ListItem key={index} sx={{ py: 2, px: 3 }}>
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Skeleton variant="circular" width={48} height={48} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="circular" width={20} height={20} />
                      </Box>
                    }
                  />
                </ListItem>
              ))
            ) : filteredChatItems.length === 0 ? (
              <ListItem sx={{ py: 4 }}>
                <ListItemText
                  primary={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        💬
                      </Typography>
                      <Typography color="text.secondary">
                        No conversations yet. Start a chat with someone!
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ) : (
              filteredChatItems.map((chatItem, index) => (
                <ListItem 
                  key={chatItem.id} 
                  disablePadding
                  sx={{
                    borderBottom: index < filteredChatItems.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: selectedChat?.id === chatItem.id ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: selectedChat?.id === chatItem.id ? 'action.selected' : 'action.hover',
                    },
                    transition: 'background-color 0.2s ease-in-out',
                  }}
                >
                  <ListItemButton 
                    onClick={() => handleChatClick(chatItem)}
                    sx={{ 
                      py: 1.5, 
                      px: 3,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Badge
                          badgeContent={chatItem.unreadCount || 0}
                          color="error"
                          invisible={!chatItem.unreadCount || chatItem.unreadCount === 0}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              minWidth: '18px',
                              height: '18px',
                              borderRadius: '9px',
                            }
                          }}
                        >
                          <Avatar 
                            src={chatItem.photoURL}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: chatItem.type === 'group' ? 'primary.main' : 'secondary.main',
                              fontSize: '1rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            {chatItem.type === 'group' ? <GroupIcon /> : <PersonIcon />}
                          </Avatar>
                        </Badge>
                        
                        {/* Online Status Indicator */}
                        {chatItem.type === 'direct' && chatItem.otherUserId && onlineUsers.has(chatItem.otherUserId) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              width: 12,
                              height: 12,
                              bgcolor: 'success.main',
                              borderRadius: '50%',
                              border: '2px solid white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        )}
                        
                        {/* Group Member Count Indicator */}
                        {chatItem.type === 'group' && chatItem.memberCount && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              border: '2px solid white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          >
                            {chatItem.memberCount}
                          </Box>
                        )}
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: (chatItem.unreadCount || 0) > 0 ? 700 : 600,
                              color: 'text.primary',
                              fontSize: '0.9rem',
                            }}
                          >
                            {chatItem.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {chatItem.lastMessageTime && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: (chatItem.unreadCount || 0) > 0 ? 600 : 400,
                                }}
                              >
                                {new Date(chatItem.lastMessageTime.toDate()).toLocaleDateString() === new Date().toLocaleDateString()
                                  ? chatItem.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : chatItem.lastMessageTime.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
                                }
                              </Typography>
                            )}
                            <Chip
                              label={chatItem.type === 'group' ? 'Group' : 'Direct'}
                              size="small"
                              color={chatItem.type === 'group' ? 'primary' : 'secondary'}
                              sx={{ 
                                fontSize: '0.65rem',
                                height: '18px',
                                '& .MuiChip-label': {
                                  px: 0.5,
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            noWrap
                            sx={{ 
                              flex: 1,
                              mr: 2,
                              fontWeight: (chatItem.unreadCount || 0) > 0 ? 600 : 400,
                              color: (chatItem.unreadCount || 0) > 0 ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {chatItem.lastMessageSender && (
                              <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                                {chatItem.lastMessageSender}:
                              </Box>
                            )}
                            {chatItem.lastMessage || 'No messages yet'}
                          </Typography>
                          {(chatItem.unreadCount || 0) > 0 && (
                            <Box
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: '50%',
                                minWidth: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            >
                              {(chatItem.unreadCount || 0) > 99 ? '99+' : (chatItem.unreadCount || 0)}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>

      {/* Right Side - Chat Detail */}
      {showChatDetail && selectedChat && (
        <Box sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}>
          {/* Chat Header */}
          <AppBar 
            position="static" 
            elevation={0}
            sx={{
              bgcolor: 'white',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Toolbar sx={{ px: 2 }}>
              {isMobile && (
                <IconButton 
                  edge="start" 
                  color="primary" 
                  onClick={() => setShowChatDetail(false)}
                  sx={{
                    mr: 2,
                    bgcolor: 'grey.100',
                    '&:hover': {
                      bgcolor: 'grey.200',
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                <Avatar 
                  src={selectedChat.type === 'direct' ? otherUserProfile?.photoURL : undefined}
                  sx={{ 
                    mr: 2,
                    width: 40,
                    height: 40,
                    bgcolor: selectedChat.type === 'direct' ? 'secondary.main' : 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {selectedChat.type === 'direct' ? <PersonIcon /> : <GroupIcon />}
                </Avatar>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isLoadingName ? (
                      <Skeleton 
                        variant="text" 
                        width={120} 
                        height={24}
                        sx={{ fontSize: '1.25rem' }}
                      />
                    ) : (
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'text.primary',
                          fontSize: '1.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayName || selectedChat.name || 'Unknown User'}
                      </Typography>
                    )}
                    {selectedChat.type === 'direct' && selectedChat.otherUserId && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
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
                      fontSize: '0.75rem',
                    }}
                  >
                    {selectedChat.type === 'direct' ? 
                      (otherUserProfile ? 'Direct Message' : 'Loading...') : 
                      `${groupMembers.length} members`
                    }
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                color="primary" 
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
            p: 2, 
            borderRadius: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
            flexShrink: 0,
          }}>
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
                  width: 48,
                  height: 48,
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      )}

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onClose={() => setNewGroupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={newGroupData.name}
            onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={newGroupData.description}
            onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Members</InputLabel>
            <Select
              multiple
              value={newGroupData.selectedUsers}
              onChange={(e) => setNewGroupData({ ...newGroupData, selectedUsers: e.target.value as string[] })}
              label="Select Members"
            >
              {allUsers
                .filter(user => user.uid !== currentUser?.uid)
                .map((user) => (
                  <MenuItem key={user.uid} value={user.uid}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={user.photoURL} sx={{ mr: 1, width: 24, height: 24 }}>
                        <PersonIcon />
                      </Avatar>
                      {user.name} ({user.email})
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGroupDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createNewGroup}
            disabled={!newGroupData.name || newGroupData.selectedUsers.length === 0}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
