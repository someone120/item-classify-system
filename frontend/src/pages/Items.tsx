import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ItemList from '../components/items/ItemList';
import ItemDialog from '../components/items/ItemDialog';
import PageContainer from '../components/PageContainer';
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getLocations,
} from '../utils/api';
import type { Item, ItemInput, Location, ItemFilter } from '../types';

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

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filter: ItemFilter = {};
      if (filterCategory) filter.category = filterCategory;
      if (filterLocation !== '') filter.location_id = filterLocation;
      if (searchTerm) filter.search = searchTerm;

      const data = await getItems(Object.keys(filter).length > 0 ? filter : undefined);
      setItems(data);
    } catch (err) {
      setError('加载物品失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterLocation, searchTerm]);

  const loadLocations = useCallback(async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadLocations();
  }, [loadItems, loadLocations]);

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
    <PageContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>物品管理</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                管理仓库中的所有物品，支持筛选和快速搜索
            </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadItems}
            disabled={loading}
            sx={{ borderRadius: '12px' }}
          >
            刷新
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleAdd}
            sx={{ px: 3 }}
          >
            添加物品
          </Button>
        </Box>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 4, 
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'surfaceContainer', // Use customized surface
        }}
      >
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="搜索物品名称或规格..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ 
                flexGrow: 1, 
                minWidth: { xs: '100%', md: 300 },
                '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'transparent' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                } 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <Box display="flex" gap={2} sx={{ width: { xs: '100%', md: 'auto' }, flexGrow: { xs: 1, md: 0 } }}>
             <FormControl sx={{ minWidth: 160, flex: 1 }}>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  displayEmpty
                  sx={{ 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper',
                      '& fieldset': { borderColor: 'transparent' },
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                  renderValue={(selected) => {
                      if (selected === '') {
                        return <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}><FilterListIcon sx={{fontSize: 20, mr: 1}}/> 全部分类</Box>;
                      }
                      return selected;
                  }}
                >
                  <MenuItem value="">全部分类</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 160, flex: 1 }}>
                <Select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value as number | '')}
                  displayEmpty
                  sx={{ 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper', 
                      '& fieldset': { borderColor: 'transparent' },
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                  renderValue={(value) => {
                    const selected = value as number | '';
                    if (selected === '') {
                      return <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>全部位置</Box>;
                    }
                    const loc = locations.find(l => l.id === (selected as number));
                    return loc ? loc.name : selected;
                  }}
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
    </PageContainer>
  );
};

export default Items;
