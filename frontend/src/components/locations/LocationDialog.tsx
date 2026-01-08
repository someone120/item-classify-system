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
} from '@mui/material';
import type { Location, LocationInput } from '../../types';

interface Props {
  open: boolean;
  location?: Location | null;
  parentId?: number | null;
  onClose: () => void;
  onSave: (input: LocationInput) => Promise<void>;
}

const LocationDialog: React.FC<Props> = ({
  open,
  location,
  parentId,
  onClose,
  onSave,
}) => {
  const [name, setName] = React.useState('');
  const [locationType, setLocationType] = React.useState<'shelf' | 'box' | 'compartment'>('box');
  const [description, setDescription] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (location) {
      setName(location.name);
      setLocationType(location.location_type);
      setDescription(location.description || '');
    } else {
      setName('');
      setLocationType('box');
      setDescription('');
    }
  }, [location, open]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const input: LocationInput = {
        name: name.trim(),
        parent_id: parentId || location?.parent_id,
        location_type: locationType,
        description: description.trim() || undefined,
      };
      await onSave(input);
      handleClose();
    } catch (error) {
      console.error('Failed to save location:', error);
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {location ? '编辑位置' : '添加位置'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="位置名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            disabled={saving}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>位置类型</InputLabel>
            <Select
              value={locationType}
              label="位置类型"
              onChange={(e) => setLocationType(e.target.value as any)}
              disabled={saving}
            >
              <MenuItem value="shelf">货架</MenuItem>
              <MenuItem value="box">盒子</MenuItem>
              <MenuItem value="compartment">隔间</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="描述"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
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

export default LocationDialog;
