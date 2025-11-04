'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../lib/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '../../../context/ConfirmDialogContext';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'operator']),
  temporaryPassword: z
    .string()
    .min(8)
    .max(50)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
});

type FormValues = z.infer<typeof schema>;

const editSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'operator']),
});

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
};

const defaultValues: FormValues = {
  name: '',
  email: '',
  role: 'operator',
  temporaryPassword: undefined,
};

const UsersPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const { confirm } = useConfirmDialog();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetTokenInfo, setResetTokenInfo] = useState<{ email: string; token: string; password?: string } | null>(
    null,
  );
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      const message = 'Kullanıcı listesi yüklenemedi.';
      setLoadError(message);
      notifyError(message);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch users:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    void fetchUsers();
  }, [fetchUsers, isAuthenticated, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitLoading(true);
    try {
      const response = await api.post('/users', values);
      await fetchUsers();
      notifySuccess('Kullanıcı başarıyla oluşturuldu.');
      setResetTokenInfo({
        email: response.data.user.email,
        token: response.data.resetToken,
        password: response.data.generatedPassword,
      });
      reset(defaultValues);
    } catch (error) {
      const message = 'Kullanıcı oluşturulurken bir hata oluştu.';
      notifyError(message);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create user:', error);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    const confirmed = await confirm({
      title: 'Kullanıcıyı Sil',
      description: `${user.email} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
    });
    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(user.id);
      await api.delete(`/users/${user.id}`);
      notifySuccess('Kullanıcı silindi.');
      await fetchUsers();
    } catch (error) {
      notifyError('Kullanıcı silme işlemi başarısız.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to delete user:', error);
      }
    } finally {
      setDeleteLoadingId(null);
    }
  };

  useEffect(() => {
    if (resetTokenInfo) {
      notifyInfo('Yeni kullanıcı için doğrulama e-postası gönderildi. Geçici parolayı paylaşmayı unutmayın.');
    }
  }, [notifyInfo, resetTokenInfo]);

  const openEditDialog = (user: UserRow) => {
    setEditingUser(user);
    editReset({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEditDialogOpen(false);
  };

  const {
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'operator',
    },
  });

  const onEditSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      await api.patch(`/users/${editingUser.id}`, values);
      notifySuccess('Kullanıcı güncellendi.');
      closeEditDialog();
      await fetchUsers();
    } catch (error) {
      notifyError('Kullanıcı güncellenemedi.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to update user:', error);
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleResendVerification = async (user: UserRow) => {
    setResendLoadingId(user.id);
    try {
      await api.post(`/users/${user.id}/resend-verification`);
      notifySuccess('Doğrulama e-postası gönderildi.');
    } catch (error) {
      notifyError('Doğrulama e-postası gönderilemedi.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to resend verification:', error);
      }
    } finally {
      setResendLoadingId(null);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Kullanıcı Yönetimi
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Yeni Kullanıcı Oluştur
        </Typography>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="İsim"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="email"
                label="E-posta"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Stack>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2 }}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select {...field} fullWidth label="Rol" displayEmpty>
                <MenuItem value="admin">Yönetici</MenuItem>
                <MenuItem value="operator">Operatör</MenuItem>
              </Select>
            )}
          />
          <Controller
            name="temporaryPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="password"
                label="Geçici Parola (opsiyonel)"
                fullWidth
                error={!!errors.temporaryPassword}
                helperText={errors.temporaryPassword?.message}
              />
            )}
          />
        </Stack>
        <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" disabled={submitLoading}>
            {submitLoading ? 'Kaydediliyor...' : 'Kullanıcı Oluştur'}
          </Button>
        </Box>
        {resetTokenInfo && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Yeni kullanıcı için bilgiler:</Typography>
            <Typography variant="body2">E-posta: {resetTokenInfo.email}</Typography>
            <Typography variant="body2">Doğrulama bağlantısı e-posta olarak gönderildi.</Typography>
            {resetTokenInfo.password && (
              <Typography variant="body2">Geçici Parola: {resetTokenInfo.password}</Typography>
            )}
            <Typography variant="body2">Reset Token: {resetTokenInfo.token}</Typography>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Kullanıcı Listesi
        </Typography>
        {loadError && <Alert severity="error">{loadError}</Alert>}
        {loading ? (
          <Box sx={{ py: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} variant="rounded" height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>İsim</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Doğrulama</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role === 'admin' ? 'Yönetici' : 'Operatör'} color={user.role === 'admin' ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isEmailVerified ? 'Doğrulandı' : 'Bekliyor'}
                        color={user.isEmailVerified ? 'success' : 'warning'}
                        variant={user.isEmailVerified ? 'filled' : 'outlined'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton onClick={() => openEditDialog(user)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Doğrulamayı Yeniden Gönder">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleResendVerification(user)}
                            disabled={user.isEmailVerified || resendLoadingId === user.id}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteLoadingId === user.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit(onEditSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={editControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="İsim"
                    fullWidth
                    error={!!editErrors.name}
                    helperText={editErrors.name?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={editControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="email"
                    label="E-posta"
                    fullWidth
                    error={!!editErrors.email}
                    helperText={editErrors.email?.message}
                  />
                )}
              />
              <Controller
                name="role"
                control={editControl}
                render={({ field }) => (
                  <Select {...field} fullWidth>
                    <MenuItem value="admin">Yönetici</MenuItem>
                    <MenuItem value="operator">Operatör</MenuItem>
                  </Select>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Vazgeç</Button>
            <Button type="submit" variant="contained" disabled={editLoading}>
              {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
};

export default UsersPage;
