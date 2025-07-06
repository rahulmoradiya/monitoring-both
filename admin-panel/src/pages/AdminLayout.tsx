import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Box, Button, AppBar, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 220;

export default function AdminLayout({ companyDetails }: { companyDetails?: any }) {
  const navigate = useNavigate();

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
            <Box
              component="img"
              src={companyDetails?.logoUrl || "https://via.placeholder.com/80?text=Logo"}
              alt="Company Logo"
              sx={{ width: 80, height: 80, borderRadius: '50%', mb: 1, bgcolor: '#eee', objectFit: 'cover', border: '2px solid #1976d2' }}
            />
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
              <ListItemButton component={NavLink} to="/admin/profile">
                <ListItemText primary="Profile" />
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
              <AccountCircleIcon sx={{ color: '#888', mr: 1 }} />
              <Typography sx={{ fontWeight: 500, color: '#222', fontSize: '1rem' }}>Rahul Moradiya</Typography>
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