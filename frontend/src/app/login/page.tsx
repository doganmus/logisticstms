'use client';

import React, { useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../lib/api';

const useLoginErrorMessage = () => {
  return useMemo(
    () => ({
      fromStatus: (status?: number) => {
        switch (status) {
          case 400:
          case 401:
            return 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
          case 429:
            return 'Çok fazla deneme yaptınız. Lütfen bir dakika sonra tekrar deneyin.';
          case 500:
            return 'Sunucuda beklenmeyen bir hata oluştu. Biraz sonra tekrar deneyin.';
          default:
            return 'Giriş sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
        }
      },
      network: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
    }),
    [],
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const messageCatalog = useLoginErrorMessage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.accessToken) {
        notifySuccess('Başarıyla giriş yapıldı. Dashboard yükleniyor...');
        login(response.data.accessToken);
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string | string[] }>;
      const status = err.response?.status;
      const responseMessage = err.response?.data?.message;
      const friendlyMessage = responseMessage
        ? Array.isArray(responseMessage)
          ? responseMessage.join(' ')
          : responseMessage
        : status
        ? messageCatalog.fromStatus(status)
        : err.request
        ? messageCatalog.network
        : messageCatalog.fromStatus(undefined);

      setError(friendlyMessage);
      notifyError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
