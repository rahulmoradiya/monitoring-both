import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
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
  const [name] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    
    setForgotPasswordLoading(true);
    setError('');
    setForgotPasswordSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setForgotPasswordLoading(false);
    }
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
                Welcome Back
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
              {/* Login screen only; signup moved to /signup */}

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

              {/* Forgot Password Link */}
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  sx={{
                    color: '#667eea',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                    '&:disabled': {
                      color: '#999',
                    }
                  }}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Forgot Password?'}
                </Button>
              </Box>

              {forgotPasswordSuccess && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 3,
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    '& .MuiAlert-icon': {
                      color: '#4caf50'
                    }
                  }}
                >
                  Password reset email sent! Check your inbox and follow the instructions.
                </Alert>
              )}

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
                  'Sign In'
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

              <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/signup')} sx={{ py: 2, fontSize: '1rem', fontWeight: 600, borderRadius: 3, borderColor: '#667eea', color: '#667eea', background: 'rgba(102, 126, 234, 0.05)', '&:hover': { borderColor: '#5a6fd8', background: 'rgba(102, 126, 234, 0.1)', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)' }, transition: 'all 0.3s ease' }}>
                No account? Create One
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