import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { Item } from '../../types';

interface ItemListProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items, onEdit, onDelete }) => {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            暂无物品，点击"添加物品"开始创建
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      {items.map((item) => {
        const isLowStock = item.min_quantity && item.quantity <= item.min_quantity;

        return (
          <Box key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: isLowStock ? '2px solid #f44336' : '1px solid rgba(0,0,0,0.12)',
              }}
            >
              {isLowStock && (
                <Tooltip title="库存不足">
                  <WarningIcon
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                </Tooltip>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {item.name}
                </Typography>
                {item.category && (
                  <Chip
                    label={item.category}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                )}
                {item.specifications && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    规格: {item.specifications}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  数量: <strong>{item.quantity}</strong> {item.unit || '个'}
                </Typography>
                {item.min_quantity && (
                  <Typography variant="caption" color="textSecondary">
                    最小库存: {item.min_quantity}
                  </Typography>
                )}
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <Tooltip title="编辑">
                  <IconButton size="small" onClick={() => onEdit(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="删除">
                  <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
};

export default ItemList;
