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
  Chip,
  Card,
  CardContent,
  Fade,
  CircularProgress
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
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Modern Back to Home Button */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 3, textAlign: 'left' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(102, 126, 234, 0.2)',
                color: '#667eea',
                fontWeight: 600,
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Fade>

        {/* Modern Header */}
        <Fade in timeout={800}>
          <Card sx={{ 
            mb: 4, 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 4,
              textAlign: 'center'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                '& .MuiSvgIcon-root': {
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }
              }}>
                <Security sx={{ 
                  fontSize: 64, 
                  color: 'white',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }} />
              </Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 700, 
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                mb: 1
              }}>
                HACCP Admin
              </Typography>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {isRegister ? 'Create Your Account' : 'Welcome Back'}
              </Typography>
            </Box>
          </Card>
        </Fade>

        {/* Modern Login/Register Form */}
        <Fade in timeout={1000}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 4 }}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RegisterIcon sx={{ color: '#667eea' }} />
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LoginIcon sx={{ color: '#667eea' }} />
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{
                          color: '#667eea',
                          '&:hover': {
                            background: 'rgba(102, 126, 234, 0.1)',
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: 3,
                    background: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    '& .MuiAlert-icon': {
                      color: '#f44336'
                    }
                  }}
                >
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
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                    transform: 'none',
                    boxShadow: 'none'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    Processing...
                  </Box>
                ) : (
                  isRegister ? 'Create Account' : 'Sign In'
                )}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Chip 
                  label="or" 
                  sx={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontWeight: 600,
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}
                />
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setIsRegister(r => !r)}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  borderColor: '#667eea',
                  color: '#667eea',
                  background: 'rgba(102, 126, 234, 0.05)',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    background: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isRegister ? 'Already have an account? Sign In' : 'No account? Create One'}
              </Button>
            </Stack>
          </form>
            </CardContent>
          </Card>
        </Fade>

        {/* Modern Footer Info */}
        <Fade in timeout={1200}>
          <Box sx={{ 
            textAlign: 'center', 
            mt: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            p: 2
          }}>
            <Typography variant="body1" sx={{ 
              color: '#667eea',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Secure • Reliable • Compliant
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
} 