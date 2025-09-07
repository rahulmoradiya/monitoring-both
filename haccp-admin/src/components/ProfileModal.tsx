import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { auth, db, storage } from '../firebase';
import { updateProfile, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDocs, collectionGroup, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdate?: (photoURL: string) => void;
}

export default function ProfileModal({ open, onClose, onProfileUpdate }: ProfileModalProps) {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (open) {
      fetchUserMeta();
    }
  }, [open]);

  const fetchUserMeta = async () => {
    setLoading(true);
    setError('');
    try {
      if (user) {
        // Find user doc in any company
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setRole(userDoc.data().role || 'user');
          setCompanyCode(userDoc.data().companyCode || '');
          setDepartmentName(userDoc.data().departmentName || '');
          setResponsibilities(userDoc.data().responsibilities || []);
          setDisplayName(userDoc.data().name || user?.displayName || '');
        }
      }
    } catch (err: any) {
      setError('Failed to fetch user info.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
    setNewPhoto(null);
    setSuccess('');
    setError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    let updatedPhotoURL = photoURL;
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setSaving(false);
      setError('Profile update timed out. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      console.log('Starting profile update...');
      
      // Handle photo upload if there's a new photo
      if (newPhoto) {
        console.log('Uploading new photo...', newPhoto.name, newPhoto.size);
        
        // Validate file size (max 5MB)
        if (newPhoto.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }
        
        // Validate file type
        if (!newPhoto.type.startsWith('image/')) {
          throw new Error('Please select a valid image file');
        }
        
        const storageRef = ref(storage, `user-avatars/${user.uid}.jpg`);
        console.log('Storage ref created:', storageRef.fullPath);
        
        await uploadBytes(storageRef, newPhoto);
        console.log('Photo uploaded successfully');
        
        updatedPhotoURL = await getDownloadURL(storageRef);
        console.log('Photo URL obtained:', updatedPhotoURL);
      }
      
      // Update Firebase Auth profile
      console.log('Updating Firebase Auth profile...');
      await updateProfile(user, {
        displayName,
        photoURL: updatedPhotoURL,
      });
      console.log('Firebase Auth profile updated');
      
      setPhotoURL(updatedPhotoURL);
      
      // Update Firestore user document
      console.log('Updating Firestore user document...');
      const usersSnap = await getDocs(collectionGroup(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
      
      if (userDoc) {
        const userData = userDoc.data();
        const companyCode = userData.companyCode;
        console.log('Found user document, company code:', companyCode);
        
        const userJson = {
          ...userData,
          name: displayName,
          photoURL: updatedPhotoURL,
        };
        
        await setDoc(doc(db, 'companies', companyCode, 'users', user.uid), userJson);
        console.log('Firestore user document updated');
      } else {
        console.warn('User document not found in Firestore');
      }
      
      clearTimeout(timeoutId);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      console.log('Profile update completed successfully');
      
      // Notify parent component about the profile update
      if (onProfileUpdate) {
        onProfileUpdate(updatedPhotoURL);
      }
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditMode(false);
    setSuccess('');
    setError('');
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err: any) {
      setError('Failed to logout. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !user.email) return;
    
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        return;
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log back in before changing password');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Profile
        </Typography>
        {!editMode && (
          <IconButton onClick={handleEdit} size="small">
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Avatar Section */}
            <Box sx={{ position: 'relative', mb: 3 }}>
              <Avatar
                src={photoURL || undefined}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  fontSize: 32, 
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {!photoURL && (displayName ? displayName[0] : email[0])}
              </Avatar>
              {editMode && (
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    bottom: -4, 
                    right: -4, 
                    bgcolor: 'white', 
                    border: '2px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      bgcolor: 'grey.50'
                    }
                  }}
                  component="span"
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                >
                  <PhotoCamera sx={{ color: 'primary.main', fontSize: 16 }} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />
                </IconButton>
              )}
            </Box>

            {/* Profile Information */}
            {editMode ? (
              <TextField
                label="Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 40 }}
              />
            ) : (
              <Box sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  {displayName || email}
                </Typography>
                
                {/* Profile Details List */}
                <List sx={{ width: '100%' }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <EmailIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={email}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <WorkIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Role" 
                      secondary={role}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  
                  {departmentName && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <BusinessIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Department" 
                        secondary={departmentName}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                  
                  {responsibilities.length > 0 && (
                    <ListItem sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AssignmentIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Responsibilities
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 4 }}>
                        {responsibilities.map((resp, idx) => (
                          <Chip key={idx} label={resp} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </ListItem>
                  )}
                </List>
              </Box>
            )}

            {/* Role Chip */}
            <Chip 
              label={role} 
              color="primary" 
              variant="outlined" 
              sx={{ 
                mb: 2, 
                fontWeight: 600, 
                textTransform: 'capitalize' 
              }} 
            />

            {/* Account Info */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Account Created
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {user?.metadata?.creationTime}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Last Sign-In
              </Typography>
              <Typography variant="body2">
                {user?.metadata?.lastSignInTime}
              </Typography>
            </Box>

            {/* Password Change Section */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon fontSize="small" />
                  Change Password
                </Typography>
                <IconButton 
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  size="small"
                >
                  {showPasswordChange ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={showPasswordChange}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                          size="small"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                  />
                  
                  <TextField
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                  />
                  
                  <TextField
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                      size="small"
                      startIcon={changingPassword ? <CircularProgress size={16} /> : <LockIcon />}
                      sx={{ flex: 1 }}
                    >
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelPasswordChange}
                      disabled={changingPassword}
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                  </Box>
                  
                  {passwordError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {passwordError}
                    </Alert>
                  )}
                  
                  {passwordSuccess && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      {passwordSuccess}
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Error/Success Messages */}
            {error && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" sx={{ mt: 2, textAlign: 'center' }}>
                {success}
              </Typography>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, width: '100%' }}>
              {editMode ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || (!displayName && !newPhoto)}
                    fullWidth
                  >
                    {saving ? <CircularProgress size={20} /> : 'Save'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={saving}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    fullWidth
                  >
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLogout}
                    fullWidth
                    startIcon={<ExitToAppIcon />}
                  >
                    Logout
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
