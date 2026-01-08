import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        设置
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="textSecondary">
          数据同步（WebDAV/S3）配置功能正在开发中...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Settings;
