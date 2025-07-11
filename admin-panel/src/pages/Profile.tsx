import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Avatar, Typography, Button, TextField, Box, Chip, CircularProgress, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDocs, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
          }
        }
      } catch (err: any) {
        setError('Failed to fetch user info.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserMeta();
  }, [user]);

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
    try {
      if (newPhoto) {
        const storageRef = ref(storage, `user-avatars/${user.uid}.jpg`);
        await uploadBytes(storageRef, newPhoto);
        updatedPhotoURL = await getDownloadURL(storageRef);
      }
      await updateProfile(user, {
        displayName,
        photoURL: updatedPhotoURL,
      });
      setPhotoURL(updatedPhotoURL);
      setEditMode(false);
      setSuccess('Profile updated!');
    } catch (err: any) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#f7fafd' }}>
      <Card sx={{ minWidth: 350, maxWidth: 420, p: 3, boxShadow: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={photoURL || undefined}
              sx={{ width: 96, height: 96, fontSize: 40, bgcolor: '#1976d2' }}
            >
              {!photoURL && (displayName ? displayName[0] : email[0])}
            </Avatar>
            {editMode && (
              <IconButton
                sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#fff', border: '1px solid #1976d2' }}
                component="span"
                onClick={() => fileInputRef.current?.click()}
              >
                <PhotoCamera sx={{ color: '#1976d2' }} />
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
          {editMode ? (
            <TextField
              label="Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 40 }}
            />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{displayName || email}</Typography>
          )}
          <Chip label={role} color="primary" variant="outlined" sx={{ mb: 2, fontWeight: 600, textTransform: 'capitalize' }} />
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>{email}</Typography>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#888' }}>Account Created</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>{user?.metadata?.creationTime}</Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>Last Sign-In</Typography>
            <Typography variant="body2">{user?.metadata?.lastSignInTime}</Typography>
          </Box>
          {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
          {success && <Typography color="success.main" sx={{ mb: 1 }}>{success}</Typography>}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            {editMode ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || (!displayName && !newPhoto)}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 