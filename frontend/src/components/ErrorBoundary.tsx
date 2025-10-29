'use client';

import React, { ErrorInfo, ReactNode, useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

type ErrorBoundaryProps = {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unhandled UI error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            textAlign: 'center',
            px: 3,
          }}
        >
          <Typography variant="h5" component="h1">
            Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We hit an unexpected error while loading this page. You can try again or return to the dashboard.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={this.handleRetry}>
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { notifyError } = useNotification();

  const handleError = useCallback(
    (error: Error) => {
      notifyError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
    },
    [notifyError],
  );

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
};
