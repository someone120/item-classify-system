import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const Inventory: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        库存管理
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="textSecondary">
          库存管理功能正在开发中...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Inventory;
