import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const Labels: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        标签打印
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="textSecondary">
          PDF 标签生成功能正在开发中...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Labels;
