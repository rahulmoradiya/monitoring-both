import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Fade,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security,
  PersonAdd as RegisterIcon,
  Login as LoginIcon,
  ArrowBack
} from '@mui/icons-material';

export default function SignupPage({ onSignup }: { onSignup: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const companyCode = uuidv4().slice(0, 8);

      await setDoc(doc(db, 'companies', companyCode), {
        name: name || 'My Company',
        ownerUid: user.uid,
        createdAt: new Date(),
        plan: 'free'
      });

      await setDoc(doc(db, 'companies', companyCode, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        companyCode,
        role: 'owner',
        createdAt: new Date(),
      });

      try { await sendEmailVerification(user); } catch {}
      onSignup();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', py: 4, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: `\
          radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),\
          radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),\
          radial-gradient(circle at 40% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%)
        `, zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>

        <Fade in timeout={800}>
          <Card sx={{ mb: 4, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Security sx={{ fontSize: 64, color: 'white' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', mb: 1 }}>HACCP Admin</Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 400, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Create Your Account</Typography>
            </Box>
          </Card>
        </Fade>

        <Fade in timeout={1000}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Full Name" variant="outlined" value={name} onChange={e => setName(e.target.value)} required sx={{ mb: 3 }} InputProps={{ startAdornment: (<InputAdornment position="start"><RegisterIcon sx={{ color: '#667eea' }} /></InputAdornment>) }} />
                <TextField fullWidth label="Email Address" type="email" variant="outlined" value={email} onChange={e => setEmail(e.target.value)} required sx={{ mb: 3 }} InputProps={{ startAdornment: (<InputAdornment position="start"><LoginIcon sx={{ color: '#667eea' }} /></InputAdornment>) }} />
                <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} variant="outlined" value={password} onChange={e => setPassword(e.target.value)} required sx={{ mb: 3 }} InputProps={{ startAdornment: (<InputAdornment position="start"><Security sx={{ color: '#667eea' }} /></InputAdornment>), endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: '#667eea' }}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
                <TextField fullWidth label="Confirm Password" type={showPassword ? 'text' : 'password'} variant="outlined" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required sx={{ mb: 2 }} InputProps={{ startAdornment: (<InputAdornment position="start"><Security sx={{ color: '#667eea' }} /></InputAdornment>), endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: '#667eea' }}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} helperText={password && confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ' '} error={Boolean(password && confirmPassword && password !== confirmPassword)} />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 2, fontSize: '1.1rem', fontWeight: 600, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)' }}>
                  {loading ? (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} sx={{ color: 'white' }} />Creating...</Box>) : 'Create Account'}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Chip label="or" sx={{ background: 'rgba(102, 126, 234, 0.1)', color: '#667eea', fontWeight: 600, border: '1px solid rgba(102, 126, 234, 0.2)' }} />
                </Divider>

                <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/login')} sx={{ py: 2, fontSize: '1rem', fontWeight: 600, borderRadius: 3, borderColor: '#667eea', color: '#667eea' }}>
                  Already have an account? Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
}


