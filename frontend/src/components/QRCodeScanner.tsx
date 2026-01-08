import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { QrCodeScanner as QrCodeIcon } from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRCodeScanner: React.FC<Props> = ({ open, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    setError('');
    setScanning(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Ignore scan errors, they're normal when no QR code is in view
          console.warn('Scan error:', errorMessage);
        }
      );
    } catch (err) {
      setError('无法启动摄像头: ' + (err as Error).message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>扫描二维码</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {scanning && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
              将二维码对准摄像头
            </Typography>
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </Box>
        )}
        {!scanning && !error && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeScanner;
