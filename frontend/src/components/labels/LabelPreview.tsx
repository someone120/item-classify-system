import { useRef, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import type { Item } from '../../types';

export interface LabelConfig {
  template: 'compact' | 'standard' | 'detailed';
  fontSize: number;
  showFields: {
    name: boolean;
    specifications: boolean;
    quantity: boolean;
    location: boolean;
    qrCode: boolean;
  };
  columns: number;
  rows: number;
}

interface LabelPreviewProps {
  items: Item[];
  config: LabelConfig;
  paperSize: string;
  loading?: boolean;
}

const LabelPreview = ({ items, config, paperSize, loading }: LabelPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Paper dimensions in mm (for aspect ratio)
  const paperDimensions = {
    'A4': { width: 210, height: 297 },
    'Letter': { width: 216, height: 279 },
    'A5': { width: 148, height: 210 },
  };

  const paper = paperDimensions[paperSize as keyof typeof paperDimensions] || paperDimensions['A4'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size (maintain aspect ratio)
    const maxWidth = 400;
    const scale = maxWidth / paper.width;
    const canvasWidth = maxWidth;
    const canvasHeight = paper.height * scale;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    // Calculate cell dimensions
    const cellWidth = canvasWidth / config.columns;
    const cellHeight = canvasHeight / config.rows;
    const padding = 8;

    // Get font sizes based on template and config
    const baseFontSize = config.fontSize * scale * 0.5;
    const titleFontSize = config.template === 'compact' ? baseFontSize : baseFontSize * 1.2;
    const detailFontSize = baseFontSize * 0.9;

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let col = 1; col < config.columns; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cellWidth, 0);
      ctx.lineTo(col * cellWidth, canvasHeight);
      ctx.stroke();
    }

    for (let row = 1; row < config.rows; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * cellHeight);
      ctx.lineTo(canvasWidth, row * cellHeight);
      ctx.stroke();
    }

    // Draw items
    const displayItems = items.slice(0, config.columns * config.rows);
    
    displayItems.forEach((item, idx) => {
      const col = idx % config.columns;
      const row = Math.floor(idx / config.columns);
      const x = col * cellWidth + padding;
      const y = row * cellHeight + padding;
      const contentWidth = cellWidth - padding * 2;
      const contentHeight = cellHeight - padding * 2;

      // QR code size (right side)
      const qrSize = config.showFields.qrCode 
        ? Math.min(contentHeight * 0.8, contentWidth * 0.35) 
        : 0;
      const textWidth = contentWidth - qrSize - (qrSize > 0 ? padding : 0);

      let currentY = y;

      // Draw name
      if (config.showFields.name) {
        ctx.fillStyle = '#212121';
        ctx.font = `bold ${titleFontSize}px "Microsoft YaHei", sans-serif`;
        const name = item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name;
        ctx.fillText(name, x, currentY + titleFontSize);
        currentY += titleFontSize + 4;
      }

      // Draw specifications (standard and detailed only)
      if (config.showFields.specifications && item.specifications && config.template !== 'compact') {
        ctx.fillStyle = '#616161';
        ctx.font = `${detailFontSize}px "Microsoft YaHei", sans-serif`;
        const specs = item.specifications.length > 20 
          ? item.specifications.substring(0, 20) + '...' 
          : item.specifications;
        ctx.fillText(`规格: ${specs}`, x, currentY + detailFontSize);
        currentY += detailFontSize + 3;
      }

      // Draw quantity
      if (config.showFields.quantity) {
        ctx.fillStyle = '#1976d2';
        ctx.font = `bold ${detailFontSize}px "Microsoft YaHei", sans-serif`;
        ctx.fillText(`数量: ${item.quantity} ${item.unit || '个'}`, x, currentY + detailFontSize);
        currentY += detailFontSize + 3;
      }

      // Draw location (detailed only)
      if (config.showFields.location && item.location_name && config.template === 'detailed') {
        ctx.fillStyle = '#616161';
        ctx.font = `${detailFontSize}px "Microsoft YaHei", sans-serif`;
        ctx.fillText(`位置: ${item.location_name}`, x, currentY + detailFontSize);
      }

      // Draw QR code placeholder
      if (config.showFields.qrCode && qrSize > 0) {
        const qrX = x + textWidth + padding;
        const qrY = row * cellHeight + (cellHeight - qrSize) / 2;
        
        // Draw QR code frame
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = '#bdbdbd';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);

        // Draw simple QR pattern (placeholder)
        const moduleSize = qrSize / 7;
        ctx.fillStyle = '#212121';
        
        // Corner patterns
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (i === 1 && j === 1) continue;
            ctx.fillRect(qrX + i * moduleSize, qrY + j * moduleSize, moduleSize * 0.8, moduleSize * 0.8);
            ctx.fillRect(qrX + (4 + i) * moduleSize, qrY + j * moduleSize, moduleSize * 0.8, moduleSize * 0.8);
            ctx.fillRect(qrX + i * moduleSize, qrY + (4 + j) * moduleSize, moduleSize * 0.8, moduleSize * 0.8);
          }
        }
      }
    });

    // If no items, show placeholder text
    if (items.length === 0) {
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('请选择物品以预览标签', canvasWidth / 2, canvasHeight / 2);
      ctx.textAlign = 'left';
    }

  }, [items, config, paper]);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backgroundColor: '#fafafa'
      }}
    >
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        预览 ({paperSize}, {config.columns}×{config.rows} 布局, {config.template} 模板)
      </Typography>
      
      <Box 
        sx={{ 
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          backgroundColor: 'white'
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }} 
        />
        
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.8)'
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </Box>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
        显示前 {Math.min(items.length, config.columns * config.rows)} 个物品
        {items.length > config.columns * config.rows && 
          ` (共 ${items.length} 个，将生成 ${Math.ceil(items.length / (config.columns * config.rows))} 页)`
        }
      </Typography>
    </Paper>
  );
};

export default LabelPreview;
