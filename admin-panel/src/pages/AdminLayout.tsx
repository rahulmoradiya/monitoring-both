import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Box, Button, AppBar, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const drawerWidth = 220;

export default function AdminLayout({ companyDetails }: { companyDetails?: any }) {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || 'User';
  const email = user?.email || '';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
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
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/overview">
                <ListItemText primary="Overview" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/setup">
                <ListItemText primary="Setup" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/teams">
                <ListItemText primary="Teams" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/monitoring-plan">
                <ListItemText primary="Monitoring" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/layout">
                <ListItemText primary="Layout" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/sop">
                <ListItemText primary="SOPs" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/tasks">
                <ListItemText primary="Tasks" />
              </ListItemButton>
            </ListItem>
          </List>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            sx={{ mt: 4, width: '90%', ml: '5%' }}
          >
            Logout
          </Button>
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
              <IconButton onClick={() => navigate('/admin/profile')} size="small" sx={{ ml: 1 }}>
                <AccountCircleIcon sx={{ color: '#888' }} />
                <Typography sx={{ fontWeight: 500, color: '#222', fontSize: '1rem', ml: 1 }}>{displayName}</Typography>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 