'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Box, 
  Card, 
  CardContent, 
  Typography 
} from '@mui/material';
import { checkApiConnection } from '@/lib/api/apiService';
import Image from 'next/image';
import LoginForm from '@/components/organisms/auth/forms/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a return URL in the query params
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    if (returnUrl) {
      sessionStorage.setItem('returnUrl', returnUrl);
    }

    // Check API connection
    const checkConnection = async () => {
      const isConnected = await checkApiConnection();
      if (!isConnected) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      }
    };
    
    checkConnection();
  }, []);
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Card 
          sx={{ 
            width: '100%', 
            boxShadow: 3,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent 
            sx={{ 
              pt: 5, 
              px: 4, 
              pb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box 
              sx={{ 
                mb: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}
            >
              <Image
                src="/ff-logo.svg"
                alt="FeasibilityFinance"
                width={180}
                height={48}
                style={{ height: 'auto' }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                sx={{ 
                  mt: 4, 
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                Welcome Back
              </Typography>
              <Typography 
                variant="body1" 
                align="center" 
                color="textSecondary"
                sx={{ mt: 1 }}
              >
                Sign in to your FeasibilityFinance account
              </Typography>
            </Box>            
            <LoginForm initialError={error} />
          </CardContent>
        </Card>
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 4, textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} FeasibilityFinance. All rights reserved.        </Typography>
      </Box>
    </Container>
  );
}
