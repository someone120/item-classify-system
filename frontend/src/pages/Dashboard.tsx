import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  alpha,
} from '@mui/material';
import LocationIcon from '@mui/icons-material/LocationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';

import PageContainer from '../components/PageContainer';

const Dashboard = () => {
  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
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
          mb: 4,
        }}
      >
        <DashboardCard 
          title="总位置数" 
          value="0" 
          icon={<LocationIcon sx={{ fontSize: 32 }} />} 
          color="primary"
        />
        <DashboardCard 
          title="总物品数" 
          value="0" 
          icon={<InventoryIcon sx={{ fontSize: 32 }} />} 
          color="secondary"
        />
        <DashboardCard 
          title="库存预警" 
          value="0" 
          icon={<WarningIcon sx={{ fontSize: 32 }} />} 
          color="error"
        />
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          bgcolor: 'surfaceContainer', // Custom palette color if defined, or fallback
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          欢迎回来
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
          物品分类管理系统已准备就绪。您可以使用左侧菜单导航至各个功能模块，开始管理您的库存和物品。系统正在持续初始化数据...
        </Typography>
      </Paper>
    </PageContainer>
  );
};

const DashboardCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'primary' | 'secondary' | 'error' }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette[color].main, 0.15)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: '16px', 
              bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
              color: (theme) => theme.palette[color].main,
              display: 'flex',
              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette[color].main, 0.2)}`,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
