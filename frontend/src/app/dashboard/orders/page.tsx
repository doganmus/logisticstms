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
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Skeleton,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
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
  createdAt: string;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface SupplierOption {
  id: string;
  name: string;
}

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    search: '',
    sortBy: 'createdAt' as 'createdAt' | 'orderNumber' | 'status',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    dateFrom: '',
    dateTo: '',
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (pageToLoad: number, appliedFilters = filters, appliedLimit = limit) => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await api.get('/orders', {
          params: {
            page: pageToLoad,
            limit: appliedLimit,
            sortBy: appliedFilters.sortBy,
            sortOrder: appliedFilters.sortOrder,
            status: appliedFilters.status || undefined,
            supplierId: appliedFilters.supplierId || undefined,
            search: appliedFilters.search || undefined,
            dateFrom: appliedFilters.dateFrom || undefined,
            dateTo: appliedFilters.dateTo || undefined,
          },
        });
        setOrders(response.data.data);
        setTotalPages(response.data.meta.totalPages);
        setPage(response.data.meta.currentPage);
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
    },
    [filters, limit, notifyError],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      void fetchOrders(page);
    }
  }, [fetchOrders, isAuthenticated, page, router]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setSuppliersLoading(true);
      setSuppliersError(null);
      const response = await api.get('/suppliers', { params: { page: 1, limit: 100 } });
      const list = response.data.data ?? response.data;
      if (Array.isArray(list)) {
        setSuppliers(list.map((supplier: { id: string; name: string }) => ({ id: supplier.id, name: supplier.name })));
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      setSuppliersError('Tedarikçiler yüklenemedi');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch suppliers:', error);
      }
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (suppliersError) {
      notifyError(suppliersError);
    }
  }, [notifyError, suppliersError]);

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  const handleAssignmentSuccess = (payload: { orderId: string; supplier: SupplierOption }) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === payload.orderId
          ? {
              ...order,
              supplier: {
                id: payload.supplier.id,
                name: payload.supplier.name,
              },
              status: 'assigned',
            }
          : order,
      ),
    );
    notifySuccess('Sipariş başarıyla güncellendi.');
    void fetchOrders(page);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    const newLimit = Number(event.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const updated = { ...filters, [key]: value };
    if (key === 'dateFrom' && filters.dateTo && value && value > filters.dateTo) {
      updated.dateTo = value;
    }
    if (key === 'dateTo' && filters.dateFrom && value && value < filters.dateFrom) {
      updated.dateFrom = value;
    }
    setFilters(updated);
    setPage(1);
  };

  const handleSortChange = (field: 'createdAt' | 'orderNumber' | 'status', order: 'ASC' | 'DESC') => {
    const updated = { ...filters, sortBy: field, sortOrder: order };
    setFilters(updated);
    setPage(1);
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
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { md: 'center' } }}
      >
        <TextField
          label="Ara"
          value={filters.search}
          onChange={(event) => handleFilterChange('search', event.target.value)}
          size="small"
          fullWidth
          sx={{ maxWidth: { xs: '100%', md: 200 } }}
        />
        <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel id="status-filter-label">Durum</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Durum"
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value as string)}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel id="supplier-filter-label">Tedarikçi</InputLabel>
          <Select
            labelId="supplier-filter-label"
            label="Tedarikçi"
            value={filters.supplierId}
            onChange={(event) => handleFilterChange('supplierId', event.target.value as string)}
            disabled={suppliersLoading || !!suppliersError}
          >
            <MenuItem value="">Tümü</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Başlangıç"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.dateFrom}
          onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
          fullWidth
          sx={{ maxWidth: { xs: '100%', md: 180 } }}
        />
        <TextField
          label="Bitiş"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.dateTo}
          onChange={(event) => handleFilterChange('dateTo', event.target.value)}
          inputProps={{ min: filters.dateFrom || undefined }}
          fullWidth
          sx={{ maxWidth: { xs: '100%', md: 180 } }}
        />
        <FormControl size="small" sx={{ minWidth: 120, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel id="per-page-label">Sayfa Başına</InputLabel>
          <Select
            labelId="per-page-label"
            value={String(limit)}
            label="Sayfa Başına"
            onChange={handleLimitChange}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchOrders(page)}>
              Tekrar dene
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ mt: 2 }}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rounded" height={56} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : (
        <OrdersList
          orders={orders}
          onAssign={handleOpenModal}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
        />
      )}
      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            shape="rounded"
            color="primary"
          />
        </Box>
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
