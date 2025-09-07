import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Toolbar, Box, Button, AppBar, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
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
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || 'User';
  const email = user?.email || '';
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState(user?.photoURL || '');


  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleProfileUpdate = (newPhotoURL: string) => {
    setUserPhotoURL(newPhotoURL);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#f4f4f4' },
        }}
      >
        <Toolbar />
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
            {companyDetails?.logoUrl ? (
              <img
                src={companyDetails.logoUrl}
                alt="Company Logo"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #1976d2',
                  background: '#fff'
                }}
              />
            ) : (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: '3px solid #1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: 18,
                  background: '#fff',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                Company<br />Logo
              </div>
            )}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', letterSpacing: 1 }}>
            {companyDetails?.name || "Company name"}
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* 1. Dashboard */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/dashboard">
                <ListItemIcon>
                  <DashboardIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>

            {/* 2. Location */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/location">
                <ListItemIcon>
                  <DashboardCustomizeIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Location" />
              </ListItemButton>
            </ListItem>

            {/* 3. Settings */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/settings">
                <ListItemIcon>
                  <SettingsIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>

            {/* 4. Teams Management */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/teams-management">
                <ListItemIcon>
                  <GroupIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Teams Management" />
              </ListItemButton>
            </ListItem>

            {/* 5. Files or SOPs */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/files">
                <ListItemIcon>
                  <DescriptionIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Files or SOPs" />
              </ListItemButton>
            </ListItem>

            {/* 6. Manage Monitoring */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/manage">
                <ListItemIcon>
                  <MonitorIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Manage Monitoring" />
              </ListItemButton>
            </ListItem>

            {/* 7. Manage Tasks */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/manage-tasks">
                <ListItemIcon>
                  <AssignmentIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Manage Tasks" />
              </ListItemButton>
            </ListItem>

            {/* 8. Audit */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/audit">
                <ListItemIcon>
                  <VerifiedIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Audit" />
              </ListItemButton>
            </ListItem>

            {/* 9. Chat */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/chat">
                <ListItemIcon>
                  <ChatIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Chat" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#fafbfc', minHeight: '100vh', p: 0 }}>
        {/* Top Bar */}
        <AppBar position="static" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #e0e0e0', boxShadow: 'none', background: '#fff' }}>
          <Toolbar sx={{ justifyContent: 'flex-end', minHeight: 56 }}>
            <Tooltip title="Help">
              <IconButton color="success" sx={{ mr: 1 }}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton color="default" sx={{ mr: 1 }}>
                <NotificationsNoneIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <IconButton onClick={handleProfileClick} size="small" sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={userPhotoURL || user?.photoURL || undefined} 
                  sx={{ width: 32, height: 32, fontSize: 14 }}
                >
                  {!(userPhotoURL || user?.photoURL) && (displayName ? displayName[0] : email[0])}
                </Avatar>
                <Typography sx={{ fontWeight: 500, color: '#222', fontSize: '1rem' }}>{displayName}</Typography>
              </IconButton>
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