'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TableSortLabel,
} from '@mui/material';

// Keep the interface consistent
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

interface OrdersListProps {
  orders: Order[];
  onAssign: (order: Order) => void; // Callback to open the assignment modal
  sortBy: 'createdAt' | 'orderNumber' | 'status';
  sortOrder: 'ASC' | 'DESC';
  onSortChange: (field: OrdersListProps['sortBy'], order: 'ASC' | 'DESC') => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onAssign, sortBy, sortOrder, onSortChange }) => {
  const handleSort = (field: OrdersListProps['sortBy']) => {
    const isAsc = sortBy === field && sortOrder === 'ASC';
    onSortChange(field, isAsc ? 'DESC' : 'ASC');
  };

  const statusColor = (status: string): 'default' | 'success' | 'warning' | 'info' | 'error' => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'in_transit':
        return 'info';
      case 'canceled':
        return 'error';
      case 'assigned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="orders table">
        <TableHead>
          <TableRow>
            <TableCell sortDirection={sortBy === 'orderNumber' ? sortOrder.toLowerCase() as 'asc' | 'desc' : false}>
              <TableSortLabel
                active={sortBy === 'orderNumber'}
                direction={sortBy === 'orderNumber' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                onClick={() => handleSort('orderNumber')}
              >
                Order Number
              </TableSortLabel>
            </TableCell>
            <TableCell>Origin</TableCell>
            <TableCell>Destination</TableCell>
            <TableCell sortDirection={sortBy === 'status' ? sortOrder.toLowerCase() as 'asc' | 'desc' : false}>
              <TableSortLabel
                active={sortBy === 'status'}
                direction={sortBy === 'status' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                onClick={() => handleSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell sortDirection={sortBy === 'createdAt' ? sortOrder.toLowerCase() as 'asc' | 'desc' : false}>
              <TableSortLabel
                active={sortBy === 'createdAt'}
                direction={sortBy === 'createdAt' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'desc'}
                onClick={() => handleSort('createdAt')}
              >
                Created At
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.orderNumber}</TableCell>
              <TableCell>{order.origin}</TableCell>
              <TableCell>{order.destination}</TableCell>
              <TableCell>
                <Chip label={order.status.toUpperCase()} color={statusColor(order.status)} size="small" />
              </TableCell>
              <TableCell>{order.supplier ? order.supplier.name : 'N/A'}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => onAssign(order)}
                  disabled={!!order.supplier} // Disable if already assigned
                >
                  Assign Supplier
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrdersList;
