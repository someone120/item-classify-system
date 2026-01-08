import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import ItemList from '../components/items/ItemList';
import ItemDialog from '../components/items/ItemDialog';
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getLocations,
} from '../utils/api';
import type { Item, ItemInput, Location } from '../types';

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<number | ''>('');

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const filter: any = {};
      if (filterCategory) filter.category = filterCategory;
      if (filterLocation) filter.location_id = filterLocation;
      if (searchTerm) filter.search = searchTerm;

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
  }, [searchTerm, filterCategory, filterLocation]);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`确定要删除物品"${item.name}"吗？`)) {
      return;
    }

    try {
      await deleteItem(item.id);
      await loadItems();
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const handleSave = async (input: ItemInput) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, input);
    } else {
      await createItem(input);
    }
    await loadItems();
  };

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">物品管理</Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadItems}
            disabled={loading}
          >
            刷新
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            添加物品
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="搜索物品名称或规格..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>分类筛选</InputLabel>
            <Select
              value={filterCategory}
              label="分类筛选"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="">全部分类</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
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
        </Box>
      </Paper>

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
        ) : (
          <ItemList items={items} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Paper>

      <ItemDialog
        open={dialogOpen}
        item={selectedItem}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
};

export default Items;
