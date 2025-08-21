import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ color: '#1976d2', fontWeight: 600 }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Content */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 3, textAlign: 'center' }}>
            Privacy Policy
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            We collect information you provide directly to us, such as when you create an account, 
            including your name, email address, and company information. We also collect information 
            about your use of our services and any communications you have with us.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            We use the information we collect to provide, maintain, and improve our services, 
            to communicate with you, to ensure compliance with food safety regulations, and to 
            protect the security and integrity of our platform.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            3. Information Sharing
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            without your consent, except as described in this policy or as required by law.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            4. Data Security
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            5. Your Rights
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            You have the right to access, update, or delete your personal information. You may also 
            request that we restrict or stop processing your information.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            6. Contact Us
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            If you have any questions about this Privacy Policy, please contact us at 
            privacy@haccpadmin.com
          </Typography>

          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              This privacy policy is effective as of the date listed above and will remain in effect 
              except with respect to any changes in its provisions in the future.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
