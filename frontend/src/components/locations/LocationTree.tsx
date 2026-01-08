import React, { useState } from 'react';
import {
  Box,
  TreeItem,
  TreeView,
  IconButton,
  Card,
  CardContent,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  AddBox as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
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
  onAdd: (parentId: number) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onShowQR: (location: Location) => void;
}> = ({ location, allLocations, onAdd, onEdit, onDelete, onShowQR }) => {
  const children = allLocations.filter((l) => l.parent_id === location.id);

  return (
    <TreeItem
      nodeId={location.id.toString()}
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            flexGrow: 1,
          }}
        >
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {location.name}
          </Typography>
          <Chip
            label={getTypeLabel(location.location_type)}
            size="small"
            color={getTypeColor(location.location_type)}
            sx={{ mr: 0.5 }}
          />
          <Tooltip title="添加子位置">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(location.id);
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="编辑">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(location);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="二维码">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShowQR(location);
              }}
            >
              <QrCodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="删除">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(location);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      {children.map((child) => (
        <LocationTreeNode
          key={child.id}
          location={child}
          allLocations={allLocations}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onShowQR={onShowQR}
        />
      ))}
    </TreeItem>
  );
};

const LocationTree: React.FC<LocationTreeProps> = ({
  locations,
  onAdd,
  onEdit,
  onDelete,
  onShowQR,
}) => {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const rootLocations = locations.filter((l) => l.parent_id === null);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

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
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      expanded={expanded}
      onNodeToggle={handleToggle}
      sx={{ flexGrow: 1 }}
    >
      {rootLocations.map((location) => (
        <LocationTreeNode
          key={location.id}
          location={location}
          allLocations={locations}
          onAdd={(id) => onAdd(id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onShowQR={onShowQR}
        />
      ))}
    </TreeView>
  );
};

export default LocationTree;
