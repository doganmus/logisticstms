'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import api from '../../lib/api';
import { useNotification } from '../context/NotificationContext';

interface Supplier {
  id: string;
  name: string;
}

interface Order {
  id: string;
}

interface AssignSupplierModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const AssignSupplierModal: React.FC<AssignSupplierModalProps> = ({
  open,
  onClose,
  order,
  onSuccess,
}) => {
  const { notifyError } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const fetchSuppliers = async () => {
        try {
          setLoading(true);
          setError('');
          const response = await api.get('/suppliers');
          setSuppliers(response.data);
        } catch (err) {
          const message =
            'Tedarikçi listesi yüklenemedi. Lütfen tekrar deneyin.';
          setError(message);
          notifyError(message);
          if (process.env.NODE_ENV !== 'production') {
            console.error(err);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchSuppliers();
    } else {
      setSelectedSupplier('');
      setError('');
    }
  }, [open, notifyError]);

  const handleAssign = async () => {
    if (!order || !selectedSupplier) return;

    try {
      setError('');
      setLoading(true);
      await api.patch(`/orders/${order.id}`, {
        supplierId: selectedSupplier,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const message =
        'Tedarikçi ataması sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      setError(message);
      notifyError(message);
      if (process.env.NODE_ENV !== 'production') {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Assign Supplier to Order
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="supplier-select-label">Supplier</InputLabel>
              <Select
                labelId="supplier-select-label"
                value={selectedSupplier}
                label="Supplier"
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                Vazgeç
              </Button>
              <Button
                variant="contained"
                onClick={handleAssign}
                disabled={!selectedSupplier || loading}
              >
                Assign
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default AssignSupplierModal;
