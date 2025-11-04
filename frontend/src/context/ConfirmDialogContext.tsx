'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PendingConfirm =
  | (ConfirmOptions & {
      resolve: (value: boolean) => void;
    })
  | null;

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPendingConfirm({ ...options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (pendingConfirm) {
      pendingConfirm.resolve(result);
      setPendingConfirm(null);
    }
  };

  const value = useMemo<ConfirmDialogContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={Boolean(pendingConfirm)}
        onClose={() => handleClose(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {pendingConfirm?.title ?? 'Onayla'}
        </DialogTitle>
        {pendingConfirm?.description && (
          <DialogContent>
            <DialogContentText id="confirm-dialog-description">
              {pendingConfirm.description}
            </DialogContentText>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => handleClose(false)}>
            {pendingConfirm?.cancelLabel ?? 'Vazgeç'}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            variant="contained"
            color="primary"
          >
            {pendingConfirm?.confirmLabel ?? 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};
