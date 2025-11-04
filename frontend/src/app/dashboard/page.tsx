'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import Link from 'next/link';

const DashboardPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const { confirm } = useConfirmDialog();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 6 }}>
        <CircularProgress />
      </Box>
    );
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
        <Link href="/dashboard/users" passHref>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Manage Users
          </Button>
        </Link>
        <Button
          variant="outlined"
          onClick={async () => {
            const confirmed = await confirm({
              title: 'Oturumu kapat',
              description: 'Çıkış yapmak istediğinize emin misiniz?',
              confirmLabel: 'Çıkış yap',
            });
            if (confirmed) {
              logout();
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default DashboardPage;
