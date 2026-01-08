import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getItems, updateQuantity, getLocations } from '../utils/api';
import type { Item, Location } from '../types';

const Inventory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<number | ''>('');

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const filter: any = {};
      if (filterLocation) filter.location_id = filterLocation;

      const data = await getItems(Object.keys(filter).length > 0 ? filter : undefined);
      setItems(data);
    } catch (err) {
      setError('加载物品失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  useEffect(() => {
    loadItems();
    loadLocations();
  }, [filterLocation]);

  const handleOpenDialog = (item: Item, op: 'add' | 'remove') => {
    setSelectedItem(item);
    setOperation(op);
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    try {
      const change = operation === 'add' ? quantity : -quantity;

      await updateQuantity(selectedItem.id, change, operation);
      await loadItems();
      handleCloseDialog();
    } catch (err) {
      alert('操作失败: ' + (err as Error).message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        库存管理
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>位置筛选</InputLabel>
          <Select
            value={filterLocation}
            label="位置筛选"
            onChange={(e) => setFilterLocation(e.target.value as number | '')}
          >
            <MenuItem value="">全部位置</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button startIcon={<RefreshIcon />} onClick={loadItems} disabled={loading}>
          刷新
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, minHeight: 400 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" py={4}>
            暂无物品
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {items.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  {item.category && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      分类: {item.category}
                    </Typography>
                  )}
                  {item.specifications && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      规格: {item.specifications}
                    </Typography>
                  )}
                  <Typography variant="h5" color="primary" gutterBottom>
                    库存: {item.quantity} {item.unit || '个'}
                  </Typography>
                  {item.min_quantity && item.quantity <= item.min_quantity && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      库存不足！最小库存: {item.min_quantity}
                    </Alert>
                  )}
                  <Box display="flex" gap={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog(item, 'add')}
                    >
                      入库
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<RemoveIcon />}
                      onClick={() => handleOpenDialog(item, 'remove')}
                      disabled={item.quantity <= 0}
                    >
                      出库
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {operation === 'add' ? '入库' : '出库'} - {selectedItem?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="数量"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            sx={{ mt: 2 }}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
