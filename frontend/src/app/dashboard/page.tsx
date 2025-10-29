'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

const DashboardPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    // Or a loading spinner
    return null;
  }

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        Welcome to your Dashboard
      </Typography>
      <Box>
        <Link href="/dashboard/orders" passHref>
          <Button variant="contained" sx={{ mr: 2 }}>
            View Orders
          </Button>
        </Link>
        <Button variant="outlined" onClick={logout}>
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default DashboardPage;
