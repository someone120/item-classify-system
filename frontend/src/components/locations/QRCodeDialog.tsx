import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { generateLocationQR } from '../../utils/api';

interface Props {
  open: boolean;
  locationId: number | null;
  locationName: string;
  onClose: () => void;
}

const QRCodeDialog: React.FC<Props> = ({
  open,
  locationId,
  locationName,
  onClose,
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open && locationId) {
      setLoading(true);
      generateLocationQR(locationId)
        .then((data) => {
          setQrData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to generate QR code:', error);
          setLoading(false);
        });
    }
  }, [open, locationId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${locationName} - 二维码</title></head>
          <body style="text-align: center; padding: 20px;">
            <h2>${locationName}</h2>
            <img src="${qrData}" style="width: 300px; height: 300px;" />
            <p>扫描此二维码以访问位置</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>位置二维码 - {locationName}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : qrData ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={2}>
            <img
              src={qrData}
              alt={`${locationName} QR Code`}
              style={{ width: '250px', height: '250px' }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
              {locationName}
            </Typography>
          </Box>
        ) : (
          <Typography color="error">加载二维码失败</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
        <Button onClick={handlePrint} variant="contained" disabled={!qrData}>
          打印
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeDialog;
