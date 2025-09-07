import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Card, 
  CardContent,
  Paper,
  Stack,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Security, 
  Assignment, 
  Group, 
  Timeline, 
  CheckCircle, 
  TrendingUp,
  Login as LoginIcon,
  ArrowForward
} from '@mui/icons-material';

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'HACCP Compliance',
      description: 'Ensure food safety standards with comprehensive hazard analysis and critical control points monitoring.'
    },
    {
      icon: <Assignment sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Task Management',
      description: 'Streamline operations with organized task assignment, tracking, and completion workflows.'
    },
    {
      icon: <Group sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Team Collaboration',
      description: 'Foster teamwork with role-based access control and efficient communication tools.'
    },
    {
      icon: <Timeline sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Real-time Monitoring',
      description: 'Track production processes and quality metrics in real-time with intuitive dashboards.'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'SOP Management',
      description: 'Maintain and update standard operating procedures with version control and approval workflows.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Performance Analytics',
      description: 'Gain insights into operational efficiency with comprehensive reporting and analytics.'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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

      {/* Modern Header */}
      <Fade in timeout={600}>
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          py: 3,
          position: 'relative',
          zIndex: 1
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  p: 1,
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}>
                  <Security sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  letterSpacing: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  HACCP Admin
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Login
              </Button>
            </Box>
          </Container>
        </Box>
      </Fade>

      {/* Modern Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Card sx={{ 
            mb: 8,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 6,
              textAlign: 'center'
            }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'white',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Food Safety Management
                <br />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Made Simple</span>
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  mb: 4, 
                  maxWidth: 800, 
                  mx: 'auto',
                  lineHeight: 1.6,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                Streamline your HACCP compliance, monitor critical control points, and ensure 
                food safety standards with our comprehensive management platform.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    background: 'white',
                    color: '#667eea',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      background: '#f5f5f5',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    borderColor: 'white',
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Learn More
                </Button>
              </Stack>
            </Box>
          </Card>
        </Fade>

        {/* Modern Features Grid */}
        <Fade in timeout={1000}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 4, 
            mb: 8 
          }}>
            {features.map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.2)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ 
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      p: 1,
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease',
                    }
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 2, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666', 
                    lineHeight: 1.6,
                    fontSize: '0.95rem'
                  }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Fade>

        {/* Modern Call to Action */}
        <Fade in timeout={1200}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 6,
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mb: 3,
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Ready to Transform Your Food Safety Management?
              </Typography>
              <Typography variant="h6" sx={{ 
                mb: 4, 
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                Join thousands of food manufacturers who trust our platform for HACCP compliance
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  background: 'white',
                  color: '#667eea',
                  py: 2,
                  px: 6,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    background: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Start Your Free Trial
              </Button>
            </Box>
          </Card>
        </Fade>
      </Container>

      {/* Modern Footer */}
      <Fade in timeout={1400}>
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)',
          py: 4,
          mt: 8,
          position: 'relative',
          zIndex: 1
        }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: '#667eea', 
                mb: 2,
                fontWeight: 600
              }}>
                © 2024 HACCP Admin. All rights reserved. | Food Safety Management Platform
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  onClick={() => navigate('/privacy-policy')}
                  sx={{ 
                    color: '#667eea', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    '&:hover': { 
                      color: '#5a6fd8',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 2
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Privacy Policy
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate('/terms-conditions')}
                  sx={{ 
                    color: '#667eea', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    '&:hover': { 
                      color: '#5a6fd8',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 2
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Terms & Conditions
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Fade>
    </Box>
  );
}
