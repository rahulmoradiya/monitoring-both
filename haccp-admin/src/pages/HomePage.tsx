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
  Stack
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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        py: 3,
        boxShadow: 3
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Security sx={{ fontSize: 40 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                HACCP Admin
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              Login
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 700, 
              color: '#1976d2', 
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Food Safety Management
            <br />
            <span style={{ color: '#1565c0' }}>Made Simple</span>
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#666', 
              mb: 4, 
              maxWidth: 800, 
              mx: 'auto',
              lineHeight: 1.6
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
                borderRadius: 2,
                boxShadow: 3
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
                borderRadius: 2,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  background: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Box>

        {/* Features Grid */}
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
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Call to Action */}
        <Paper 
          elevation={3} 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: 6,
            textAlign: 'center',
            borderRadius: 3
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Transform Your Food Safety Management?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of food manufacturers who trust our platform for HACCP compliance
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{
              background: 'white',
              color: '#1976d2',
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                background: '#f5f5f5',
                transform: 'scale(1.05)'
              }
            }}
          >
            Start Your Free Trial
          </Button>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ 
        background: '#f8f9fa', 
        borderTop: '1px solid #e0e0e0',
        py: 4,
        mt: 8
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              © 2024 HACCP Admin. All rights reserved. | Food Safety Management Platform
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Button
                size="small"
                onClick={() => navigate('/privacy-policy')}
                sx={{ color: '#666', textTransform: 'none', '&:hover': { color: '#1976d2' } }}
              >
                Privacy Policy
              </Button>
              <Button
                size="small"
                onClick={() => navigate('/terms-conditions')}
                sx={{ color: '#666', textTransform: 'none', '&:hover': { color: '#1976d2' } }}
              >
                Terms & Conditions
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
