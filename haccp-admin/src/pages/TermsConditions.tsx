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

export default function TermsConditions() {
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
            Terms & Conditions
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            By accessing and using the HACCP Admin platform, you accept and agree to be bound by the 
            terms and provision of this agreement. If you do not agree to abide by the above, please 
            do not use this service.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            2. Use License
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            Permission is granted to temporarily use the HACCP Admin platform for personal or commercial 
            food safety management purposes. This is the grant of a license, not a transfer of title.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            3. Disclaimer
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            The materials on the HACCP Admin platform are provided on an 'as is' basis. We make no 
            warranties, expressed or implied, and hereby disclaim and negate all other warranties 
            including without limitation, implied warranties or conditions of merchantability.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            4. Limitations
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            In no event shall HACCP Admin or its suppliers be liable for any damages arising out of 
            the use or inability to use the materials on the platform, even if we have been notified 
            orally or in writing of the possibility of such damage.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            5. Accuracy of Materials
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            The materials appearing on the HACCP Admin platform could include technical, typographical, 
            or photographic errors. We do not warrant that any of the materials on the platform are 
            accurate, complete, or current.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            6. Links
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            HACCP Admin has not reviewed all of the sites linked to its platform and is not responsible 
            for the contents of any such linked site. The inclusion of any link does not imply endorsement.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            7. Modifications
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            We may revise these terms of service for the platform at any time without notice. By using 
            this platform, you are agreeing to be bound by the then current version of these terms.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            8. Governing Law
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            These terms and conditions are governed by and construed in accordance with the laws and 
            you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </Typography>

          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              By using our service, you agree to these terms and conditions. If you have any questions, 
              please contact us at legal@haccpadmin.com
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
