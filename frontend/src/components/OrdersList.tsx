'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from '@mui/material';

// Keep the interface consistent
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

interface OrdersListProps {
  orders: Order[];
  onAssign: (order: Order) => void; // Callback to open the assignment modal
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onAssign }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Order Number</TableCell>
            <TableCell>Origin</TableCell>
            <TableCell>Destination</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Supplier</TableCell>
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
                <Chip label={order.status} color={order.status === 'ASSIGNED' ? 'success' : 'default'} />
              </TableCell>
              <TableCell>{order.supplier ? order.supplier.name : 'N/A'}</TableCell>
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
