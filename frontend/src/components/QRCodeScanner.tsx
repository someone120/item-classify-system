import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
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

  const startScanner = async () => {
    setError('');
    setScanning(true);

    try {
      // 使用 Tauri barcode-scanner 插件扫描二维码
      const result = await invoke<string>('plugin:barcode-scanner|scan', {
        formats: ['qr_code'],
        windowed: true,
      });

      if (result) {
        onScanSuccess(result);
        handleClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('扫描失败: ' + errorMessage);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    setError('');
    setScanning(false);
    onClose();
  };

  // 当对话框打开时自动开始扫描
  if (open && !scanning && !error) {
    setTimeout(() => {
      startScanner();
    }, 100);
  }

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
