import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        仪表盘
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <LocationIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  总位置数
                </Typography>
                <Typography variant="h3">0</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  总物品数
                </Typography>
                <Typography variant="h3">0</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  库存预警
                </Typography>
                <Typography variant="h3">0</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            欢迎使用物品分类管理系统
          </Typography>
          <Typography variant="body2" color="textSecondary">
            系统正在初始化中，请从左侧菜单选择功能开始使用。
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
