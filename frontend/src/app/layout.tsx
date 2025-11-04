'use client';

import { Inter } from 'next/font/google';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ConfirmDialogProvider } from '../context/ConfirmDialogContext';
import { AppErrorBoundary } from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <NotificationProvider>
            <ConfirmDialogProvider>
              <AppErrorBoundary>
                <AuthProvider>{children}</AuthProvider>
              </AppErrorBoundary>
            </ConfirmDialogProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
