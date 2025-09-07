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
  Alert,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Fade,
  Slide,
  Stack,
  Grid,
  Badge,
  LinearProgress
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
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';
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
  const [passwordChangeMode, setPasswordChangeMode] = useState<'current' | 'email'>('current');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Email password reset states
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [verifyingResetCode, setVerifyingResetCode] = useState(false);
  const [resetCodeVerified, setResetCodeVerified] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

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
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          const userData = userDoc.data();
          setRole(userData.role || 'user');
          setCompanyCode(userData.companyCode || '');
          setDepartmentName(userData.departmentName || '');
          setResponsibilities(userData.responsibilities || []);
          setDisplayName(userData.name || user?.displayName || '');
          setPhotoURL(user?.photoURL || '');
          setEmail(user?.email || '');
          setTwoFactorEnabled(userData.twoFactorEnabled || false);
        } else {
          setDisplayName(user?.displayName || '');
          setPhotoURL(user?.photoURL || '');
          setEmail(user?.email || '');
          setRole('user');
          setCompanyCode('');
          setDepartmentName('');
          setResponsibilities([]);
          setTwoFactorEnabled(false);
        }
      }
    } catch (err: any) {
      setError('Failed to fetch user info.');
    } finally {
      setLoading(false);
    }
  };



  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
      // Automatically save when photo is selected
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    let updatedPhotoURL = photoURL;
    
    const timeoutId = setTimeout(() => {
      setSaving(false);
      setError('Profile update timed out. Please try again.');
    }, 30000);
    
    try {
      if (newPhoto) {
        if (newPhoto.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }
        
        if (!newPhoto.type.startsWith('image/')) {
          throw new Error('Please select a valid image file');
        }
        
        const storageRef = ref(storage, `user-avatars/${user.uid}.jpg`);
        await uploadBytes(storageRef, newPhoto);
        updatedPhotoURL = await getDownloadURL(storageRef);
      }
      
      await updateProfile(user, {
        photoURL: updatedPhotoURL,
      });
      
      setPhotoURL(updatedPhotoURL);
      
      const usersSnap = await getDocs(collectionGroup(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
      
      if (userDoc) {
        const userData = userDoc.data();
        const companyCode = userData.companyCode;
        
        const userJson = {
          ...userData,
          photoURL: updatedPhotoURL,
        };
        
        await setDoc(doc(db, 'companies', companyCode, 'users', user.uid), userJson);
      }
      
      clearTimeout(timeoutId);
      setSuccess('Profile photo updated successfully!');
      setNewPhoto(null);
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedPhotoURL);
      }
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(`Failed to update profile: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
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

  // Password change functions
  const handlePasswordChangeWithCurrent = async () => {
    if (!user || !user.email) return;
    
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        return;
      }
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordChange(false);
    setPasswordChangeMode('current');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetCode('');
    setResetEmailSent(false);
    setResetCodeVerified(false);
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Email password reset functions
  const sendPasswordResetEmail = async () => {
    if (!user?.email) return;
    
    setSendingResetEmail(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // Import sendPasswordResetEmail from Firebase Auth
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
      setPasswordSuccess(`Password reset email sent to ${user.email}. Please check your email and click the link to reset your password.`);
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      setPasswordError('Failed to send password reset email. Please try again.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const verifyResetCode = async () => {
    if (!resetCode) return;
    
    setVerifyingResetCode(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // Import verifyPasswordResetCode from Firebase Auth
      const { verifyPasswordResetCode } = await import('firebase/auth');
      await verifyPasswordResetCode(auth, resetCode);
      setResetCodeVerified(true);
      setPasswordSuccess('Reset code verified! You can now set your new password.');
    } catch (err: any) {
      console.error('Error verifying reset code:', err);
      if (err.code === 'auth/invalid-action-code') {
        setPasswordError('Invalid or expired reset code. Please request a new one.');
      } else if (err.code === 'auth/expired-action-code') {
        setPasswordError('Reset code has expired. Please request a new one.');
      } else {
        setPasswordError('Failed to verify reset code. Please try again.');
      }
    } finally {
      setVerifyingResetCode(false);
    }
  };

  const handlePasswordResetWithEmail = async () => {
    if (!resetCode || !newPassword || !confirmPassword) return;
    
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
      
      // Import confirmPasswordReset from Firebase Auth
      const { confirmPasswordReset } = await import('firebase/auth');
      await confirmPasswordReset(auth, resetCode, newPassword);
      
      setPasswordSuccess('Password reset successfully! Please log in with your new password.');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetEmailSent(false);
      setResetCodeVerified(false);
      setShowPasswordChange(false);
      
      // Log out user after password reset
      setTimeout(() => {
        handleLogout();
      }, 2000);
      
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/invalid-action-code') {
        setPasswordError('Invalid or expired reset code. Please request a new one.');
      } else if (err.code === 'auth/expired-action-code') {
        setPasswordError('Reset code has expired. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError('Failed to reset password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '60vh'
        }
      }}
    >
      <DialogContent sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        background: 'transparent'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
            Loading Profile...
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
          maxHeight: '90vh',
          width: '90%',
          maxWidth: '800px'
        }
      }}
    >
      <Fade in={open} timeout={300}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            zIndex: 1
          }
        }}>
          {/* Header with gradient background - Compact */}
          <Box sx={{ 
            position: 'relative',
            zIndex: 2,
            p: 2,
            pb: 1,
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ 
                color: 'white', 
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Profile
              </Typography>
            </Box>

            {/* Profile Picture with modern styling - Smaller */}
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{ 
                      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                      color: 'white',
                      border: '2px solid white',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        transform: 'scale(1.1)',
                        background: 'linear-gradient(45deg, #FF5252, #26C6DA)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PhotoCamera sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <Avatar
                  src={photoURL || undefined}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    fontSize: 32, 
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {!photoURL && (displayName ? displayName[0] : email[0])}
                </Avatar>
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </Box>

            {/* User Name - Smaller */}
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 700, 
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {displayName || email}
            </Typography>

            {/* Role Badge - Smaller */}
            <Chip 
              label={role.toUpperCase()} 
              size="small"
              sx={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                mb: 2
              }} 
            />
          </Box>

          {/* Main Content with glass morphism and scroll */}
          <Box sx={{ 
            position: 'relative',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px 24px 0 0',
            maxHeight: '60vh',
            overflow: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(102, 126, 234, 0.5)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.7)',
              }
            }
          }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              {/* Left Column - User Info */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  mb: 2
                }}>
                  <CardHeader
                    sx={{ pb: 1 }}
                    title={
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '0.9rem'
                      }}>
                        <PersonIcon color="primary" sx={{ fontSize: 18 }} />
                        Personal Information
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <EmailIcon sx={{ color: '#667eea', fontSize: 18 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {email}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <WorkIcon sx={{ color: '#667eea', fontSize: 18 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Role
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {role}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {departmentName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <BusinessIcon sx={{ color: '#667eea', fontSize: 18 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Department
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                              {departmentName}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Account Activity Card */}
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}>
                  <CardHeader
                    sx={{ pb: 1 }}
                    title={
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '0.9rem'
                      }}>
                        <CalendarTodayIcon color="primary" sx={{ fontSize: 18 }} />
                        Account Activity
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Account Created
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {user?.metadata?.creationTime}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last Sign-In
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {user?.metadata?.lastSignInTime}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Right Column - Security & Actions */}
              <Box sx={{ flex: 1 }}>
                {/* Password Change Card */}
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  mb: 2
                }}>
                  <CardHeader
                    sx={{ pb: 1 }}
                    title={
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '0.9rem'
                      }}>
                        <LockIcon color="primary" sx={{ fontSize: 18 }} />
                        Security
                      </Typography>
                    }
                    action={
                      <IconButton 
                        size="small"
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        sx={{ 
                          color: '#667eea',
                          '&:hover': { transform: 'rotate(180deg)' },
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        {showPasswordChange ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    }
                  />
                  <Collapse in={showPasswordChange}>
                    <CardContent>
                      {(
                        <Box>
                          {/* Password Change Mode Selection */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <Button
                              variant={passwordChangeMode === 'current' ? 'contained' : 'outlined'}
                              startIcon={<VpnKeyIcon />}
                              onClick={() => setPasswordChangeMode('current')}
                              sx={{
                                background: passwordChangeMode === 'current' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                                borderColor: '#667eea',
                                color: passwordChangeMode === 'current' ? 'white' : '#667eea',
                                flex: 1,
                                '&:hover': {
                                  background: passwordChangeMode === 'current' ? 'linear-gradient(45deg, #5a6fd8, #6a4190)' : 'rgba(102, 126, 234, 0.04)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Current Password
                            </Button>
                            <Button
                              variant={passwordChangeMode === 'email' ? 'contained' : 'outlined'}
                              startIcon={<EmailIcon />}
                              onClick={() => setPasswordChangeMode('email')}
                              sx={{
                                background: passwordChangeMode === 'email' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                                borderColor: '#667eea',
                                color: passwordChangeMode === 'email' ? 'white' : '#667eea',
                                flex: 1,
                                '&:hover': {
                                  background: passwordChangeMode === 'email' ? 'linear-gradient(45deg, #5a6fd8, #6a4190)' : 'rgba(102, 126, 234, 0.04)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Email Reset
                            </Button>
                          </Box>

                          {/* Current Password Mode */}
                          {passwordChangeMode === 'current' && (
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
                              
                              <Button
                                variant="contained"
                                onClick={handlePasswordChangeWithCurrent}
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                startIcon={changingPassword ? <CircularProgress size={16} /> : <LockIcon />}
                                fullWidth
                                sx={{
                                  background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {changingPassword ? 'Changing...' : 'Change Password'}
                              </Button>
                            </Box>
                          )}

                          {/* Email Reset Mode */}
                          {passwordChangeMode === 'email' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Alert severity="info" sx={{ mb: 2 }}>
                                Don't remember your current password? We'll send a reset link to your email.
                              </Alert>
                              
                              {!resetEmailSent ? (
                                <Button
                                  variant="contained"
                                  onClick={sendPasswordResetEmail}
                                  disabled={sendingResetEmail}
                                  startIcon={sendingResetEmail ? <CircularProgress size={16} /> : <SendIcon />}
                                  fullWidth
                                  sx={{
                                    background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                                    '&:hover': {
                                      background: 'linear-gradient(45deg, #F57C00, #EF6C00)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  {sendingResetEmail ? 'Sending...' : 'Send Reset Email'}
                                </Button>
                              ) : !resetCodeVerified ? (
                                <>
                                  <TextField
                                    label="Enter Reset Code from Email"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="Paste the reset code from your email"
                                    helperText="Check your email for the password reset link and copy the code from the URL"
                                  />
                                  
                                  <Button
                                    variant="contained"
                                    onClick={verifyResetCode}
                                    disabled={verifyingResetCode || !resetCode}
                                    startIcon={verifyingResetCode ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                                    fullWidth
                                    sx={{
                                      background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                                      '&:hover': {
                                        background: 'linear-gradient(45deg, #1976D2, #1565C0)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {verifyingResetCode ? 'Verifying...' : 'Verify Code'}
                                  </Button>
                                </>
                              ) : (
                                <>
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
                                  
                                  <Button
                                    variant="contained"
                                    onClick={handlePasswordResetWithEmail}
                                    disabled={changingPassword || !newPassword || !confirmPassword}
                                    startIcon={changingPassword ? <CircularProgress size={16} /> : <LockIcon />}
                                    fullWidth
                                    sx={{
                                      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                                      '&:hover': {
                                        background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {changingPassword ? 'Resetting...' : 'Reset Password'}
                                  </Button>
                                </>
                              )}
                            </Box>
                          )}

                          {/* Cancel Button */}
                          <Button
                            variant="outlined"
                            onClick={handleCancelPasswordChange}
                            disabled={changingPassword}
                            fullWidth
                            sx={{
                              mt: 2,
                              borderColor: '#667eea',
                              color: '#667eea',
                              '&:hover': {
                                borderColor: '#5a6fd8',
                                background: 'rgba(102, 126, 234, 0.04)',
                                transform: 'translateY(-2px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Cancel
                          </Button>

                          {/* Error/Success Messages */}
                          {passwordError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              {passwordError}
                            </Alert>
                          )}
                          
                          {passwordSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              {passwordSuccess}
                            </Alert>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Collapse>
                </Card>

                {/* 2FA Card */}
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}>
                  <CardHeader
                    sx={{ pb: 1 }}
                    title={
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '0.9rem'
                      }}>
                        <SecurityIcon color="primary" sx={{ fontSize: 18 }} />
                        Two-Factor Authentication
                        {twoFactorEnabled && (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Enabled" 
                            color="success" 
                            size="small"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                      Add an extra layer of security to your account.
                    </Typography>
                    <Button
                      variant={twoFactorEnabled ? "outlined" : "contained"}
                      color={twoFactorEnabled ? "error" : "primary"}
                      size="small"
                      startIcon={twoFactorEnabled ? <SecurityIcon sx={{ fontSize: 16 }} /> : <ShieldIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      sx={{
                        background: twoFactorEnabled ? 'transparent' : 'linear-gradient(45deg, #667eea, #764ba2)',
                        fontSize: '0.8rem',
                        py: 0.5,
                        '&:hover': {
                          background: twoFactorEnabled ? 'rgba(244, 67, 54, 0.04)' : 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              mt: 2,
              justifyContent: 'center'
            }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={handleClose}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontSize: '0.85rem',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    background: 'rgba(102, 126, 234, 0.04)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                size="medium"
                color="error"
                startIcon={<ExitToAppIcon />}
                onClick={handleLogout}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B, #ee5a52)',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.85rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ee5a52, #e74c3c)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Logout
              </Button>
            </Box>

            {/* Error/Success Messages */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  borderRadius: 2,
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  mt: 2, 
                  borderRadius: 2,
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}
              >
                {success}
              </Alert>
            )}
          </Box>
        </Box>
      </Fade>
    </Dialog>
  );
}