import { useCallback, useEffect, useState } from 'react';
import {
  scan,
  checkPermissions,
  requestPermissions,
  Format,
} from '@tauri-apps/plugin-barcode-scanner';
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

interface Props {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRCodeScanner: React.FC<Props> = ({ open, onClose, onScanSuccess }) => {
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  const ensureCameraPermission = useCallback(async () => {
    const current = await checkPermissions();
    if (current === 'granted') {
      return;
    }
    const requested = await requestPermissions();
    if (requested !== 'granted') {
      throw new Error('相机权限未授权');
    }
  }, []);

  const handleClose = useCallback(() => {
    setError('');
    setScanning(false);
    onClose();
  }, [onClose]);

  const startScanner = useCallback(async () => {
    setError('');
    setScanning(true);

    try {
      await ensureCameraPermission();
      const result = await scan({
        formats: [Format.QRCode],
        windowed: false,
      });

      if (result?.content) {
        onScanSuccess(result.content);
        handleClose();
      } else {
        throw new Error('未识别到二维码内容');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('扫描失败: ' + errorMessage);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  }, [ensureCameraPermission, handleClose, onScanSuccess]);

  useEffect(() => {
    if (!open || scanning || error) {
      return;
    }
    const timer = setTimeout(() => {
      startScanner();
    }, 100);
    return () => clearTimeout(timer);
  }, [open, scanning, error, startScanner]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>扫描二维码</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {scanning && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
              正在启动摄像头...
            </Typography>
            <Typography variant="caption" color="textSecondary" align="center" sx={{ mt: 1 }}>
              请授权相机权限
            </Typography>
          </Box>
        )}
        {!scanning && !error && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={scanning}>
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeScanner;
