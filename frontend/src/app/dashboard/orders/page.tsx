'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';
import AssignSupplierModal from '../../../components/AssignSupplierModal';

interface Order {
  id: string;
  orderNumber: string;
  origin: string;
  destination: string;
  status: string;
  supplier: {
    id: string;
    name: string;
  } | null;
}

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      const message =
        'Sipariş listesi şu anda yüklenemedi. Lütfen birkaç dakika sonra tekrar deneyin.';
      setLoadError(message);
      notifyError(message);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch orders:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      fetchOrders();
    }
  }, [isAuthenticated, router, fetchOrders]);

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  const handleAssignmentSuccess = () => {
    notifySuccess('Sipariş başarıyla güncellendi.');
    fetchOrders();
  };

  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        Orders Management
      </Typography>
      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchOrders}>
              Tekrar dene
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <OrdersList orders={orders} onAssign={handleOpenModal} />
      )}
      <AssignSupplierModal
        open={modalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onSuccess={handleAssignmentSuccess}
      />
    </Container>
  );
};

export default OrdersPage;
