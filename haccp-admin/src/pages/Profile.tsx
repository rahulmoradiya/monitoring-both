import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard since profile is now accessible via modal
    navigate('/admin/dashboard');
  }, [navigate]);

  return null;
} 