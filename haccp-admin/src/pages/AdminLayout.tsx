import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Toolbar, Box, AppBar, IconButton, Typography, Tooltip, Avatar, Card, CardContent, Fade, Stack, Divider, Button, Popper, ClickAwayListener, Paper } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VerifiedIcon from '@mui/icons-material/Verified';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import MonitorIcon from '@mui/icons-material/Monitor';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ChatIcon from '@mui/icons-material/Chat';
import ProfileModal from '../components/ProfileModal';

const drawerWidth = 220;

export default function AdminLayout({ companyDetails }: { companyDetails?: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || 'User';
  const email = user?.email || '';
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState(user?.photoURL || '');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Search suggestions data
  const quickActions = [
    { label: 'Add Team Member', action: () => navigate('/admin/teams-management'), keywords: ['team', 'member', 'add', 'user', 'person'] },
    { label: 'Add Monitoring Task', action: () => navigate('/admin/manage'), keywords: ['monitoring', 'task', 'add', 'create', 'monitor'] },
    { label: 'Add Personal Task', action: () => navigate('/admin/manage-tasks'), keywords: ['personal', 'task', 'add', 'create', 'individual'] },
    { label: 'Create SOP', action: () => navigate('/admin/files'), keywords: ['sop', 'create', 'file', 'document', 'procedure'] },
    { label: 'Add Department', action: () => navigate('/admin/teams-management'), keywords: ['department', 'add', 'create', 'dept'] },
    { label: 'Add Location Item', action: () => navigate('/admin/location'), keywords: ['location', 'area', 'room', 'equipment', 'add'] },
  ];

  const navigationItems = [
    { label: 'Dashboard', path: '/admin/dashboard', keywords: ['dashboard', 'home', 'overview', 'main'] },
    { label: 'Teams', path: '/admin/teams-management', keywords: ['teams', 'team', 'members', 'people', 'users'] },
    { label: 'Monitoring', path: '/admin/manage', keywords: ['monitoring', 'monitor', 'tasks', 'manage'] },
    { label: 'Tasks', path: '/admin/manage-tasks', keywords: ['tasks', 'task', 'manage', 'assign'] },
    { label: 'Audit', path: '/admin/audit', keywords: ['audit', 'verification', 'check', 'review'] },
    { label: 'Chat', path: '/admin/chat', keywords: ['chat', 'message', 'communication', 'talk'] },
    { label: 'Settings', path: '/admin/settings', keywords: ['settings', 'setup', 'config', 'preferences'] },
  ];

  // Filter suggestions based on search query
  const filteredQuickActions = searchQuery 
    ? quickActions.filter(item => 
        item.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        ) || item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quickActions;

  const filteredNavigationItems = searchQuery 
    ? navigationItems.filter(item => 
        item.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        ) || item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navigationItems;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('global-search-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          setSearchAnchorEl(el);
          setShowSearch(true);
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchAnchorEl(null);
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  // Function to get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap: { [key: string]: string } = {
      '/admin/dashboard': 'Overview',
      '/admin/location': 'Location',
      '/admin/settings': 'Settings',
      '/admin/teams-management': 'Teams Management',
      '/admin/files': 'Files & SOPs',
      '/admin/manage': 'Manage Monitoring',
      '/admin/manage-tasks': 'Manage Tasks',
      '/admin/audit': 'Audit',
      '/admin/chat': 'Chat'
    };
    return titleMap[path] || 'Dashboard';
  };


  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleProfileUpdate = (newPhotoURL: string) => {
    setUserPhotoURL(newPhotoURL);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          },
        }}
      >
        {/* Modern Company Logo Section */}
        <Fade in timeout={600}>
          <Card sx={{ 
            m: 2, 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            {companyDetails?.logoUrl ? (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      mb: 2
                    }}
                  >
              <img
                src={companyDetails.logoUrl}
                alt="Company Logo"
                style={{
                        width: '100%',
                        height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: '#fff'
                }}
              />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                  borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                  textAlign: 'center',
                      lineHeight: 1.2,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      mb: 2
                }}
              >
                Company<br />Logo
                  </Box>
            )}
          </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 1,
                  fontSize: '1.1rem'
                }}
              >
            {companyDetails?.name || "Company name"}
          </Typography>
            </CardContent>
          </Card>
        </Fade>
        {/* Modern Navigation List */}
        <Box sx={{ overflow: 'auto', px: 1 }}>
          <Fade in timeout={800}>
            <List sx={{ py: 1 }}>
            {/* 1. Dashboard */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/dashboard"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <DashboardIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Dashboard" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 2. Location */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/location"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <DashboardCustomizeIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Location" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 3. Settings */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/settings"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <SettingsIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Settings" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 4. Teams Management */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/teams-management"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <GroupIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Teams Management" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 5. Files or SOPs */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/files"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <DescriptionIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Files or SOPs" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 6. Manage Monitoring */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/manage"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <MonitorIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Manage Monitoring" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 7. Manage Tasks */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/manage-tasks"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <AssignmentIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Manage Tasks" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 8. Audit */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/audit"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <VerifiedIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Audit" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>

            {/* 9. Chat */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={NavLink} 
                  to="/admin/chat"
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.active': {
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 600,
                      }
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                <ListItemIcon>
                    <ChatIcon sx={{ color: '#667eea' }} />
                </ListItemIcon>
                  <ListItemText 
                    primary="Chat" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
              </ListItemButton>
            </ListItem>
          </List>
          </Fade>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', p: 0 }}>
        {/* Modern Top Bar */}
        <AppBar 
          position="static" 
          elevation={0} 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            zIndex: (theme) => theme.zIndex.modal + 3
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 3, gap: 2 }}>
            {/* Global Search - Left Side (replaces title) */}
            <Box sx={{ flex: 1, maxWidth: 640, position: 'relative' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 3,
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.12)',
                  px: 2,
                  py: 0.5,
                  transition: 'all 0.25s ease',
                  '&:focus-within': {
                    borderColor: '#667eea',
                    boxShadow: '0 8px 28px rgba(102, 126, 234, 0.22)',
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#667eea"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input
                  id="global-search-input"
                  placeholder="⚡ Quick Finder - Search & navigate instantly (Press ⌘K / Ctrl+K)"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    width: '100%',
                    fontSize: '0.95rem',
                    padding: '10px 8px'
                  }}
                  onFocus={(e) => {
                    setSearchAnchorEl(e.currentTarget);
                    setShowSearch(true);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!showSearch) {
                      setShowSearch(true);
                    }
                  }}
                  value={searchQuery}
                />
              </Box>
              {/* Suggestions dropdown */}
              <Popper
                open={showSearch}
                anchorEl={searchAnchorEl}
                placement="bottom-start"
                sx={{ zIndex: 9999 }}
              >
                <ClickAwayListener onClickAway={(event) => {
                  // Don't close if clicking on the search input
                  if (event.target === searchAnchorEl || searchAnchorEl?.contains(event.target as Node)) {
                    return;
                  }
                  
                  // Clear any existing timeout
                  if (closeTimeout) {
                    clearTimeout(closeTimeout);
                  }
                  
                  // Set a small delay before closing to prevent flickering
                  const timeout = setTimeout(() => {
                    setShowSearch(false);
                    setSearchAnchorEl(null);
                  }, 100);
                  
                  setCloseTimeout(timeout);
                }}>
                  <Paper
                    sx={{
                      width: 640,
                      maxWidth: 'calc(100vw - 280px)',
                      background: 'rgba(255,255,255,0.98)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: 3,
                      border: '1px solid rgba(102,126,234,0.2)',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                      p: 1,
                      mt: 1
                    }}
                  >
                    {/* Quick Actions */}
                    {filteredQuickActions.length > 0 && (
                      <Box sx={{ px: 1, py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea' }}>🚀 Quick Actions</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {filteredQuickActions.map((item) => (
                            <Button
                              key={item.label}
                              onClick={() => { 
                                item.action(); 
                                setShowSearch(false);
                                setSearchAnchorEl(null);
                              }}
                              sx={{
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 2,
                                border: '1px solid rgba(102,126,234,0.3)',
                                textTransform: 'none',
                                color: '#34495e',
                                background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.06))',
                                '&:hover': { background: 'linear-gradient(135deg, rgba(102,126,234,0.14), rgba(118,75,162,0.1))' }
                              }}
                            >
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</Typography>
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    {filteredQuickActions.length > 0 && filteredNavigationItems.length > 0 && <Divider sx={{ my: 1 }} />}
                    {/* Navigation */}
                    {filteredNavigationItems.length > 0 && (
                      <Box sx={{ px: 1, py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea' }}>🧭 Navigation</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {filteredNavigationItems.map((link) => (
                            <Button
                              key={link.label}
                              onClick={() => { 
                                navigate(link.path); 
                                setShowSearch(false);
                                setSearchAnchorEl(null);
                              }}
                              sx={{
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 2,
                                border: '1px solid rgba(102,126,234,0.3)',
                                textTransform: 'none',
                                color: '#34495e',
                                background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.06))',
                                '&:hover': { background: 'linear-gradient(135deg, rgba(102,126,234,0.14), rgba(118,75,162,0.1))' }
                              }}
                            >
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{link.label}</Typography>
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* No results found */}
                    {filteredQuickActions.length === 0 && filteredNavigationItems.length === 0 && searchQuery && (
                      <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          No results found for "{searchQuery}"
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </ClickAwayListener>
              </Popper>
            </Box>

            {/* Right Side - Icons and Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Help">
                <IconButton 
                  sx={{ 
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                  }}
                >
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
                <IconButton 
                  sx={{ 
                    background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #F57C00, #EF6C00)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
                  }}
                >
                <NotificationsNoneIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <IconButton 
                  onClick={handleProfileClick} 
                  size="small" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    p: 1,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.1))',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Avatar 
                    src={userPhotoURL || user?.photoURL || undefined} 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      fontSize: 16,
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    {!(userPhotoURL || user?.photoURL) && (displayName ? displayName[0] : email[0])}
                  </Avatar>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '1rem' 
                    }}
                  >
                    {displayName}
                  </Typography>
              </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 0 }}>
          <Outlet />
        </Box>
      </Box>
      
      {/* Profile Modal */}
      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </Box>
  );
} 