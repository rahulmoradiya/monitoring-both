import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Security,
  ArrowBack
} from '@mui/icons-material';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const companyCode = uuidv4().slice(0, 8);
        await setDoc(doc(db, 'companies', companyCode, 'users', user.uid), {
          uid: user.uid,
          email,
          name,
          companyCode,
          role: 'owner',
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="sm">
        {/* Back to Home Button */}
        <Box sx={{ mb: 3, textAlign: 'left' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ color: '#1976d2', fontWeight: 600 }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Security sx={{ fontSize: 48, color: '#1976d2' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
            HACCP Admin
          </Typography>
          <Typography variant="h6" sx={{ color: '#666', fontWeight: 400 }}>
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </Typography>
        </Box>

        {/* Login/Register Form */}
        <Paper 
          elevation={8} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {isRegister && (
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RegisterIcon sx={{ color: '#1976d2' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LoginIcon sx={{ color: '#1976d2' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security sx={{ color: '#1976d2' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Chip label="or" />
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setIsRegister(r => !r)}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    background: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                {isRegister ? 'Already have an account? Sign In' : 'No account? Create One'}
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Footer Info */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Secure • Reliable • Compliant
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 