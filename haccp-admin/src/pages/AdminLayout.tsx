import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Toolbar, Box, AppBar, IconButton, Typography, Tooltip, Avatar, Card, CardContent, Fade, Stack } from '@mui/material';
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
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || 'User';
  const email = user?.email || '';
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState(user?.photoURL || '');

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
        <Toolbar />
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 3 }}>
            {/* Page Title - Left Side */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5px'
                }}
              >
                {getPageTitle()}
              </Typography>
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
        <Box sx={{ p: 3 }}>
          <Toolbar />
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