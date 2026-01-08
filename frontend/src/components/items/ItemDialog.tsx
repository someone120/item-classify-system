import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
} from '@mui/material';
import type { Item, ItemInput, Location } from '../../types';
import { getLocations } from '../../utils/api';

interface Props {
  open: boolean;
  item?: Item | null;
  onClose: () => void;
  onSave: (input: ItemInput) => Promise<void>;
}

const ItemDialog: React.FC<Props> = ({ open, item, onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [specifications, setSpecifications] = React.useState('');
  const [quantity, setQuantity] = React.useState(0);
  const [unit, setUnit] = React.useState('');
  const [locationId, setLocationId] = React.useState<number | undefined>();
  const [minQuantity, setMinQuantity] = React.useState<number | undefined>();
  const [notes, setNotes] = React.useState('');
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (open) {
      // Load locations
      getLocations().then(setLocations).catch(console.error);

      if (item) {
        setName(item.name);
        setCategory(item.category || '');
        setSpecifications(item.specifications || '');
        setQuantity(item.quantity);
        setUnit(item.unit || '');
        setLocationId(item.location_id);
        setMinQuantity(item.min_quantity);
        setNotes(item.notes || '');
      } else {
        setName('');
        setCategory('');
        setSpecifications('');
        setQuantity(0);
        setUnit('');
        setLocationId(undefined);
        setMinQuantity(undefined);
        setNotes('');
      }
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const input: ItemInput = {
        name: name.trim(),
        category: category.trim() || undefined,
        specifications: specifications.trim() || undefined,
        quantity,
        unit: unit.trim() || undefined,
        location_id: locationId,
        min_quantity: minQuantity,
        notes: notes.trim() || undefined,
      };
      await onSave(input);
      handleClose();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{item ? '编辑物品' : '添加物品'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="物品名称 *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="分类"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                placeholder="如：电阻、电容、螺丝"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="规格参数"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                disabled={saving}
                placeholder="如：5.1kΩ 1/4W"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="数量 *"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="单位"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={saving}
                placeholder="个"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="最小库存"
                type="number"
                value={minQuantity || ''}
                onChange={(e) => setMinQuantity(e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>所在位置</InputLabel>
                <Select
                  value={locationId || ''}
                  label="所在位置"
                  onChange={(e) => setLocationId(e.target.value as number | undefined)}
                  disabled={saving}
                >
                  <MenuItem value="">无位置</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="备注"
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !name.trim()}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDialog;
