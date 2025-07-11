import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, getDocs, collectionGroup } from 'firebase/firestore';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Box, Button, AppBar, IconButton, Typography, Tooltip, Avatar } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 220;

export default function AdminLayout({ companyDetails }: { companyDetails?: any }) {
  const navigate = useNavigate();
  const [registeredCompanyName, setRegisteredCompanyName] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');

  useEffect(() => {
    const fetchCompanyAndUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Get user document from Firestore
          const usersSnap = await getDocs(collectionGroup(db, 'users'));
          const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
          
          if (userDoc) {
            const userData = userDoc.data() as any;
            const companyCode = userData.companyCode;
            
            // Set user name and avatar
            setCurrentUserName(userData.name || user.displayName || 'User');
            setCurrentUserAvatar(userData.avatar || '');
            
            // Fetch company name and logo from registration
            if (companyCode) {
              const companyDoc = await getDoc(doc(db, 'companies', companyCode));
              if (companyDoc.exists()) {
                const companyData = companyDoc.data();
                setRegisteredCompanyName(companyData.name || 'Company');
                setCompanyLogoUrl(companyData.logoURL || '');
              }
            }
          }
        } catch (error) {
          console.error('Error fetching company and user data:', error);
        }
      }
    };

    fetchCompanyAndUserData();
  }, []);

  // Refresh data when user changes (for logo updates)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fetchData = async () => {
          try {
            const usersSnap = await getDocs(collectionGroup(db, 'users'));
            const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
            
            if (userDoc) {
              const userData = userDoc.data() as any;
              const companyCode = userData.companyCode;
              
              setCurrentUserName(userData.name || user.displayName || 'User');
              setCurrentUserAvatar(userData.avatar || '');
              
              if (companyCode) {
                const companyDoc = await getDoc(doc(db, 'companies', companyCode));
                if (companyDoc.exists()) {
                  const companyData = companyDoc.data();
                  setRegisteredCompanyName(companyData.name || 'Company');
                  setCompanyLogoUrl(companyData.logoURL || '');
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing company and user data:', error);
          }
        };
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

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
              src={companyLogoUrl || companyDetails?.logoUrl || "https://via.placeholder.com/80?text=Logo"}
              alt="Company Logo"
              sx={{ width: 80, height: 80, borderRadius: '50%', mb: 1, bgcolor: '#eee', objectFit: 'cover', border: '2px solid #1976d2' }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', letterSpacing: 1 }}>
            {registeredCompanyName || companyDetails?.name || "Company name"}
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
              <ListItemButton component={NavLink} to="/admin/sop">
                <ListItemText primary="SOP" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/admin/tasks">
                <ListItemText primary="Tasks" />
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 2,
                cursor: 'pointer',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                transition: 'background 0.2s',
                '&:hover': { background: 'rgba(25, 118, 210, 0.08)' }
              }}
              onClick={() => navigate('/admin/profile')}
            >
              {currentUserAvatar ? (
                <Avatar src={currentUserAvatar} sx={{ width: 32, height: 32, mr: 1 }} />
              ) : (
                <AccountCircleIcon sx={{ color: '#888', mr: 1, width: 32, height: 32 }} />
              )}
              <Typography
                sx={{ fontWeight: 500, color: '#1976d2', fontSize: '1rem', ml: 0.5 }}
              >
                {currentUserName || 'User'}
              </Typography>
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