import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
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
}

interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    selectedUsers: [] as string[]
  });

  useEffect(() => {
    const fetchCompanyCode = async () => {
      if (!currentUser) return;
      
      const usersSnap = await getDocs(collection(db, 'companies'));
      for (const companyDoc of usersSnap.docs) {
        const usersCol = await getDocs(collection(db, 'companies', companyDoc.id, 'users'));
        const userDoc = usersCol.docs.find(doc => doc.data().uid === currentUser.uid);
        if (userDoc) {
          setCompanyCode(companyDoc.id);
          break;
        }
      }
    };
    fetchCompanyCode();
  }, [currentUser]);

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

  const fetchUsers = async () => {
    if (!companyCode) return;
    
    try {
      const usersSnap = await getDocs(collection(db, 'companies', companyCode, 'users'));
      const users = usersSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
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

        const candidate = {
          id: docSnap.id,
          type: 'direct' as const,
          name: (data.participantNames && data.participantNames[otherParticipant]) || 'Unknown User',
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          lastMessageSender: data.lastMessageSender,
          unreadCount: (data.unreadCount && data.unreadCount[currentUser.uid]) || 0,
          otherUserId: otherParticipant,
          participants: data.participants,
          photoURL: allUsers.find(u => u.uid === otherParticipant)?.photoURL,
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
    if (chatItem.type === 'direct') {
      navigate(`/admin/chat/${chatItem.id}`, {
        state: {
          type: 'direct',
          chatName: chatItem.name,
          otherUserId: chatItem.otherUserId,
          companyCode
        }
      });
    } else {
      navigate(`/admin/chat/${chatItem.id}`, {
        state: {
          type: 'group',
          chatName: chatItem.name,
          companyCode
        }
      });
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
      
      // Navigate to the new group chat
      navigate(`/admin/chat/${groupRef.id}`, {
        state: {
          type: 'group',
          chatName: newGroupData.name,
          companyCode
        }
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const filteredChatItems = chatItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewGroupDialogOpen(true)}
        >
          New Group
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Paper>

      {/* Chat List */}
      <Paper sx={{ mb: 3 }}>
        <List>
          {filteredChatItems.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary" align="center">
                    No conversations yet. Start a chat with someone!
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            filteredChatItems.map((chatItem) => (
              <ListItem key={chatItem.id} disablePadding>
                <ListItemButton onClick={() => handleChatClick(chatItem)}>
                  <ListItemAvatar>
                    <Badge
                      badgeContent={chatItem.unreadCount || 0}
                      color="error"
                      invisible={!chatItem.unreadCount || chatItem.unreadCount === 0}
                    >
                      <Avatar src={chatItem.photoURL}>
                        {chatItem.type === 'group' ? <GroupIcon /> : <PersonIcon />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {chatItem.name}
                        </Typography>
                        <Chip
                          label={chatItem.type === 'group' ? 'Group' : 'Direct'}
                          size="small"
                          color={chatItem.type === 'group' ? 'primary' : 'secondary'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {chatItem.lastMessageSender && `${chatItem.lastMessageSender}: `}
                          {chatItem.lastMessage || 'No messages yet'}
                        </Typography>
                        {chatItem.lastMessageTime && (
                          <Typography variant="caption" color="text.secondary">
                            {chatItem.lastMessageTime.toDate().toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

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
