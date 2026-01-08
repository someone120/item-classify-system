import React from 'react';
import {
  Box,
  IconButton,
  Card,
  CardContent,
  Typography,
  Chip,
  Tooltip,
  Collapse,
  Stack,
} from '@mui/material';
import {
  AddBox as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { Location } from '../../types';

interface LocationTreeProps {
  locations: Location[];
  onAdd: (parentId: number | null) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onShowQR: (location: Location) => void;
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    shelf: '货架',
    box: '盒子',
    compartment: '隔间',
  };
  return labels[type] || type;
};

const getTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    shelf: 'primary',
    box: 'success',
    compartment: 'info',
  };
  return colors[type] || 'default';
};

const LocationTreeNode: React.FC<{
  location: Location;
  allLocations: Location[];
  level: number;
  onAdd: (parentId: number) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onShowQR: (location: Location) => void;
}> = ({ location, allLocations, level, onAdd, onEdit, onDelete, onShowQR }) => {
  const [expanded, setExpanded] = React.useState(false);
  const children = allLocations.filter((l) => l.parent_id === location.id);
  const hasChildren = children.length > 0;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 1,
          px: 2,
          ml: level * 2,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.02)',
          },
        }}
      >
        {hasChildren && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
          {location.name}
        </Typography>
        <Chip
          label={getTypeLabel(location.location_type)}
          size="small"
          color={getTypeColor(location.location_type)}
          sx={{ mr: 0.5 }}
        />
        <Tooltip title="添加子位置">
          <IconButton size="small" onClick={() => onAdd(location.id)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="编辑">
          <IconButton size="small" onClick={() => onEdit(location)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="二维码">
          <IconButton size="small" onClick={() => onShowQR(location)}>
            <QrCodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除">
          <IconButton size="small" color="error" onClick={() => onDelete(location)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              allLocations={allLocations}
              level={level + 1}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onShowQR={onShowQR}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
};

const LocationTree: React.FC<LocationTreeProps> = ({
  locations,
  onAdd,
  onEdit,
  onDelete,
  onShowQR,
}) => {
  const rootLocations = locations.filter((l) => l.parent_id === null);

  if (rootLocations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            暂无位置，点击"添加位置"开始创建
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Stack>
        {rootLocations.map((location) => (
          <LocationTreeNode
            key={location.id}
            location={location}
            allLocations={locations}
            level={0}
            onAdd={(id) => onAdd(id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onShowQR={onShowQR}
          />
        ))}
      </Stack>
    </Card>
  );
};

export default LocationTree;
