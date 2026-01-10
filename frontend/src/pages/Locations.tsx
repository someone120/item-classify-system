import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import LocationTree from '../components/locations/LocationTree';
import LocationDialog from '../components/locations/LocationDialog';
import QRCodeDialog from '../components/locations/QRCodeDialog';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../utils/api';
import type { Location, LocationInput } from '../types';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [qrLocation, setQrLocation] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLocations = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Calling getLocations...');
      const data = await getLocations();
      console.log('Received locations:', data);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
      setError('加载位置失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAdd = (newParentId: number | null) => {
    setSelectedLocation(null);
    setParentId(newParentId);
    setDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setParentId(null);
    setDialogOpen(true);
  };

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    setDeleting(true);
    try {
      await deleteLocation(locationToDelete.id);
      await loadLocations();
      setDeleteConfirmOpen(false);
      setLocationToDelete(null);
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setLocationToDelete(null);
  };

  const handleShowQR = (location: Location) => {
    setQrLocation({ id: location.id, name: location.name });
    setQrDialogOpen(true);
  };

  const handleSave = async (input: LocationInput) => {
    if (selectedLocation) {
      await updateLocation(selectedLocation.id, input.name, input.description);
    } else {
      await createLocation(input);
    }
    await loadLocations();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">位置管理</Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadLocations}
            disabled={loading}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAdd(null)}
          >
            添加位置
          </Button>
        </Box>
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
        ) : (
          <LocationTree
            locations={locations}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShowQR={handleShowQR}
          />
        )}
      </Paper>

      <LocationDialog
        open={dialogOpen}
        location={selectedLocation}
        parentId={parentId}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <QRCodeDialog
        open={qrDialogOpen}
        locationId={qrLocation?.id || null}
        locationName={qrLocation?.name || ''}
        onClose={() => setQrDialogOpen(false)}
      />

      <Dialog open={deleteConfirmOpen} onClose={cancelDelete}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除位置"{locationToDelete?.name}"吗？
            {locationToDelete && locations.some(l => l.parent_id === locationToDelete.id) && (
              <>
                <br />
                <br />
                <span style={{ color: '#d32f2f' }}>
                  警告：此位置包含子位置，删除后所有子位置也将被删除！
                </span>
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Locations;
