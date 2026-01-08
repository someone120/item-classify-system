import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const Items: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">物品管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          添加物品
        </Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="textSecondary">
          物品管理功能正在开发中...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Items;
