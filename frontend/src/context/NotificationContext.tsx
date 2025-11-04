'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Snackbar, Alert, AlertColor, Slide } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

type NotificationPayload = {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
};

interface NotificationContextValue {
  notify: (payload: NotificationPayload) => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyWarning: (message: string) => void;
  notifyInfo: (message: string) => void;
  close: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const Transition = (props: TransitionProps & { children: React.ReactElement }) => (
  <Slide {...props} direction="up" />
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [autoHideDuration, setAutoHideDuration] = useState<number | undefined>(
    5000,
  );

  const notify = useCallback(
    ({ message, severity = 'info', autoHideDuration }: NotificationPayload) => {
      setMessage(message);
      setSeverity(severity);
      setAutoHideDuration(autoHideDuration ?? 5000);
      setOpen(true);
    },
    [],
  );

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess: (message: string) => notify({ message, severity: 'success' }),
      notifyError: (message: string) => notify({ message, severity: 'error' }),
      notifyWarning: (message: string) => notify({ message, severity: 'warning' }),
      notifyInfo: (message: string) => notify({ message, severity: 'info' }),
      close,
    }),
    [notify, close],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Transition}
      >
        <Alert onClose={close} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
