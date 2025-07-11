import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Chip, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import { Person, Email, Business, Security, Assignment, Star, AdminPanelSettings, Group, Edit, PhotoCamera } from '@mui/icons-material';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  company: string;
  avatar?: string;
  joinDate: string;
  responsibilities: string[];
  companyCode: string;
}

interface TeamStats {
  teamMembers: number;
  activeTasks: number;
  completedReports: number;
  complianceRate: number;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    teamMembers: 0,
    activeTasks: 0,
    completedReports: 0,
    complianceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile picture state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          await fetchUserProfile(user);
          await fetchTeamStats(user);
        } catch (err) {
          console.error('Error fetching profile data:', err);
          setError('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('No user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      // Get user document from Firestore using collectionGroup to search across all companies
      const usersSnap = await getDocs(collectionGroup(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
      
      if (userDoc) {
        const userData = userDoc.data() as any;
        const companyCode = userData.companyCode;
        
        // Get company details
        let companyName = 'Unknown Company';
        if (companyCode) {
          const companyDoc = await getDoc(doc(db, 'companies', companyCode));
          if (companyDoc.exists()) {
            companyName = companyDoc.data().name || 'Unknown Company';
          }
        }

        // Format join date
        const joinDate = user.metadata.creationTime 
          ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })
          : 'Unknown';

        const profile: UserProfile = {
          name: userData.name || user.displayName || 'Unknown User',
          email: userData.email || user.email || 'No email',
          role: userData.role || 'User',
          company: companyName,
          companyCode: companyCode || '',
          joinDate: joinDate,
          responsibilities: getResponsibilitiesByRole(userData.role || 'User'),
          avatar: userData.avatar || undefined
        };

        setUserProfile(profile);
      } else {
        // Create basic profile from auth data if no Firestore document found
        const profile: UserProfile = {
          name: user.displayName || 'Unknown User',
          email: user.email || 'No email',
          role: 'User',
          company: 'Unknown Company',
          companyCode: '',
          joinDate: user.metadata.creationTime 
            ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })
            : 'Unknown',
          responsibilities: getResponsibilitiesByRole('User')
        };
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      throw err;
    }
  };

  const fetchTeamStats = async (user: User) => {
    try {
      // Get user's company code using collectionGroup
      const usersSnap = await getDocs(collectionGroup(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
      if (!userDoc) return;

      const userData = userDoc.data() as any;
      const companyCode = userData.companyCode;
      if (!companyCode) return;

      // Get team members count for the same company
      const teamMembers = usersSnap.docs.filter(doc => {
        const data = doc.data() as any;
        return data.companyCode === companyCode;
      }).length;

      // For now, we'll use mock data for tasks, reports and compliance
      // You can implement these when you have the actual data structure
      const activeTasks = Math.floor(Math.random() * 20) + 5; // Mock data
      const completedReports = Math.floor(Math.random() * 50) + 10; // Mock data
      const complianceRate = Math.floor(Math.random() * 20) + 80; // Mock data between 80-100%

      setTeamStats({
        teamMembers,
        activeTasks,
        completedReports,
        complianceRate
      });
    } catch (err) {
      console.error('Error fetching team stats:', err);
      // Set default values on error
      setTeamStats({
        teamMembers: 0,
        activeTasks: 0,
        completedReports: 0,
        complianceRate: 0
      });
    }
  };

  const handleEditClick = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditModalOpen(true);
      setSaveError(null); // Clear any previous errors
    }
  };

  const handleSaveName = async () => {
    if (!auth.currentUser || !userProfile) return;

    setSaving(true);
    setSaveError(null);
    
    try {
      // Find the user document in the correct location
      const usersSnap = await getDocs(collectionGroup(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.data().uid === auth.currentUser!.uid);
      
      if (!userDoc) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data() as any;
      const companyCode = userData.companyCode;
      
      // Update the user document in the correct location
      const userRef = doc(db, 'companies', companyCode, 'users', auth.currentUser.uid);
      
      await setDoc(userRef, {
        ...userData,
        name: editName.trim(),
        email: auth.currentUser.email,
        updatedAt: new Date()
      }, { merge: true }); // merge: true preserves existing fields

      // Update local state
      setUserProfile(prev => prev ? { ...prev, name: editName.trim() } : null);
      setEditModalOpen(false);
      setSaveSuccess(true);
      
      console.log('Name updated successfully');
    } catch (err) {
      console.error('Error updating name:', err);
      setSaveError('Failed to update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditName('');
    setSaveError(null);
  };

  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
    setSaveError(null);
    setImageSuccess(false);
    setImageError(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    setImageError(null);

    try {
      // Delete old avatar if exists
      if (userProfile?.avatar) {
        try {
          const oldAvatarRef = ref(storage, userProfile.avatar);
          await deleteObject(oldAvatarRef);
        } catch (err) {
          console.log('No old avatar to delete or error deleting:', err);
        }
      }

      // Upload new image
      const fileName = `avatars/${auth.currentUser.uid}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setImageError('Failed to upload image. Please try again.');
          setUploadingImage(false);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Find the user document in the correct location
            const usersSnap = await getDocs(collectionGroup(db, 'users'));
            const userDoc = usersSnap.docs.find(doc => doc.data().uid === auth.currentUser!.uid);
            
            if (!userDoc) {
              throw new Error('User document not found');
            }

            const userData = userDoc.data() as any;
            const companyCode = userData.companyCode;
            
            // Update the user document in the correct location
            const userRef = doc(db, 'companies', companyCode, 'users', auth.currentUser!.uid);
            
            await setDoc(userRef, {
              ...userData,
              avatar: downloadURL,
              updatedAt: new Date()
            }, { merge: true });

            // Update local state
            setUserProfile(prev => prev ? { ...prev, avatar: downloadURL } : null);
            setImageSuccess(true);
            console.log('Profile picture updated successfully');
          } catch (err) {
            console.error('Error updating profile picture:', err);
            setImageError('Failed to update profile picture. Please try again.');
          } finally {
            setUploadingImage(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (err) {
      console.error('Error in image upload:', err);
      setImageError('Failed to upload image. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const getResponsibilitiesByRole = (role: string): string[] => {
    switch (role.toLowerCase()) {
      case 'owner':
        return [
          'Full system access and control',
          'Manage company settings and configuration',
          'Create and manage team members',
          'Assign roles and permissions',
          'Monitor overall system performance',
          'Access all reports and analytics'
        ];
      case 'admin':
        return [
          'Manage team members and permissions',
          'Create and assign monitoring tasks',
          'Review and approve reports',
          'Configure company settings',
          'Monitor system analytics'
        ];
      case 'manager':
        return [
          'Assign monitoring tasks to team members',
          'Review task completion reports',
          'Manage task schedules',
          'Coordinate with team members',
          'Generate compliance reports'
        ];
      case 'user':
        return [
          'Complete assigned monitoring tasks',
          'Submit task reports on time',
          'Follow safety protocols',
          'Report issues and incidents',
          'Maintain accurate records'
        ];
      default:
        return [
          'Complete assigned tasks',
          'Follow company procedures',
          'Maintain safety standards'
        ];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'user':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <AdminPanelSettings />;
      case 'admin':
        return <AdminPanelSettings />;
      case 'manager':
        return <Star />;
      case 'user':
        return <Person />;
      default:
        return <Person />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !userProfile) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error || 'Failed to load profile'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a' }}>
        Profile
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Profile Overview Card */}
        <Box sx={{ width: { xs: '100%', md: '33%' } }}>
          <Card sx={{ height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: '#1976d2',
                    fontSize: '3rem',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={handleAvatarClick}
                >
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt={userProfile.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    userProfile.name.charAt(0).toUpperCase()
                  )}
                </Avatar>
                {/* Camera icon overlay */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                  size="small"
                  onClick={handleAvatarClick}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
                {uploadingImage && (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <CircularProgress 
                      size={120} 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: '#1976d2'
                      }} 
                    />
                  </Box>
                )}
              </Box>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {/* Name and edit button below avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mr: 1 }}>
                  {userProfile.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleEditClick}
                  sx={{ color: '#666', '&:hover': { color: '#1976d2' } }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
              {/* Owner tag below name */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Chip
                  icon={getRoleIcon(userProfile.role)}
                  label={userProfile.role}
                  color={getRoleColor(userProfile.role) as any}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Member since {userProfile.joinDate}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: '#666' }} />
                  <Typography variant="body2">{userProfile.email}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business sx={{ mr: 2, color: '#666' }} />
                  <Typography variant="body2">{userProfile.company}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Roles and Responsibilities */}
        <Box sx={{ width: { xs: '100%', md: '67%' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Role Details */}
            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 2, color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Role and Responsibility
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                  You have <strong>{userProfile.role}</strong> privileges in the system. This role grants you access to manage and oversee various aspects of the HACCP monitoring system.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="User Management" color="primary" variant="outlined" />
                  <Chip label="Task Creation" color="primary" variant="outlined" />
                  <Chip label="Report Access" color="primary" variant="outlined" />
                  <Chip label="System Settings" color="primary" variant="outlined" />
                </Box>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 2, color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Key Responsibilities
                  </Typography>
                </Box>
                
                <List sx={{ p: 0 }}>
                  {userProfile.responsibilities.map((responsibility, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#1976d2',
                            ml: 1
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={responsibility}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontSize: '0.95rem',
                            color: '#333'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Team Overview */}
            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group sx={{ mr: 2, color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Team Overview
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      {teamStats.teamMembers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                      {teamStats.activeTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Tasks
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#ed6c02', fontWeight: 600 }}>
                      {teamStats.completedReports}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Reports
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                      {teamStats.complianceRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Edit Name Modal */}
      <Dialog open={editModalOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mt: 2 }}
            error={!!saveError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveName} 
            variant="contained" 
            disabled={saving || !editName.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Name updated successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!saveError}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {saveError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={imageSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Profile picture updated successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!imageError}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {imageError}
        </Alert>
      </Snackbar>
    </Box>
  );
} 