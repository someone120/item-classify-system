import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import { getItems, generatePdfLabels, generateImageLabels } from '../utils/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Item } from '../types';

const Labels = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(2);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      setError('加载物品失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== Labels component mounted ===');
    loadItems();
  }, []);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleGenerate = async () => {
    console.log('=== handleGenerate called ===');
    console.log('Selected IDs:', selectedIds);

    if (selectedIds.length === 0) {
      console.log('No items selected, showing error');
      setError('请至少选择一个物品');
      return;
    }

    console.log('Starting PDF generation...');
    setGenerating(true);
    setError('');

    try {
      console.log('Calling generatePdfLabels with:', selectedIds, paperSize, columns, rows);
      const pdfData = await generatePdfLabels(selectedIds, paperSize, columns, rows);
      console.log('PDF data received, length:', pdfData.length);
      console.log('PDF data preview:', pdfData.substring(0, 100));

      // Remove the data URL prefix to get base64 string
      const base64Data = pdfData.split(',')[1];
      console.log('Base64 data length:', base64Data?.length);

      if (!base64Data) {
        throw new Error('Invalid PDF data format');
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Converted to bytes, length:', bytes.length);

      // Open save dialog
      console.log('Opening save dialog...');
      const filePath = await save({
        filters: [
          {
            name: 'PDF',
            extensions: ['pdf'],
          },
        ],
        defaultPath: `labels_${Date.now()}.pdf`,
      });

      console.log('File path from dialog:', filePath);

      if (filePath) {
        // Write the PDF file
        await writeFile(filePath, bytes);
        console.log('PDF saved successfully to:', filePath);
      } else {
        console.log('User cancelled save dialog');
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('生成 PDF 失败: ' + (err as Error).message);
    } finally {
      console.log('Setting generating to false');
      setGenerating(false);
    }

    console.log('=== handleGenerate completed ===');
  };

  const handleGenerateImage = async () => {
    console.log('=== handleGenerateImage called ===');
    console.log('Selected IDs:', selectedIds);

    if (selectedIds.length === 0) {
      console.log('No items selected, showing error');
      setError('请至少选择一个物品');
      return;
    }

    console.log('Starting image generation...');
    setGeneratingImage(true);
    setError('');

    try {
      console.log('Calling generateImageLabels with:', selectedIds, columns, rows);
      const imageData = await generateImageLabels(selectedIds, columns, rows);
      console.log('Image data received, length:', imageData.length);

      // Remove the data URL prefix to get base64 string
      const base64Data = imageData.split(',')[1];
      console.log('Base64 data length:', base64Data?.length);

      if (!base64Data) {
        throw new Error('Invalid image data format');
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Converted to bytes, length:', bytes.length);

      // Open save dialog
      console.log('Opening save dialog...');
      const filePath = await save({
        filters: [
          {
            name: 'PNG',
            extensions: ['png'],
          },
        ],
        defaultPath: `labels_${Date.now()}.png`,
      });

      console.log('File path from dialog:', filePath);

      if (filePath) {
        // Write the image file
        await writeFile(filePath, bytes);
        console.log('Image saved successfully to:', filePath);
      } else {
        console.log('User cancelled save dialog');
      }
    } catch (err) {
      console.error('Image generation failed:', err);
      setError('生成图片失败: ' + (err as Error).message);
    } finally {
      console.log('Setting generatingImage to false');
      setGeneratingImage(false);
    }

    console.log('=== handleGenerateImage completed ===');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        标签打印
      </Typography>

      <Stack spacing={3}>
        {/* Configuration */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            打印配置
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            <FormControl>
              <InputLabel>纸张尺寸</InputLabel>
              <Select
                value={paperSize}
                label="纸张尺寸"
                onChange={(e) => setPaperSize(e.target.value)}
              >
                <MenuItem value="A4">A4 (210 x 297 mm)</MenuItem>
                <MenuItem value="Letter">Letter (216 x 279 mm)</MenuItem>
                <MenuItem value="A5">A5 (148 x 210 mm)</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>每行标签数</InputLabel>
              <Select
                value={columns}
                label="每行标签数"
                onChange={(e) => setColumns(e.target.value as number)}
              >
                <MenuItem value={2}>2 个</MenuItem>
                <MenuItem value={3}>3 个</MenuItem>
                <MenuItem value={4}>4 个</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>每列标签数</InputLabel>
              <Select
                value={rows}
                label="每列标签数"
                onChange={(e) => setRows(e.target.value as number)}
              >
                <MenuItem value={3}>3 个</MenuItem>
                <MenuItem value={4}>4 个</MenuItem>
                <MenuItem value={5}>5 个</MenuItem>
                <MenuItem value={6}>6 个</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Item Selection */}
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              选择物品 ({selectedIds.length} / {items.length})
            </Typography>
            <Box display="flex" gap={1}>
              <Button onClick={loadItems} startIcon={<RefreshIcon />} disabled={loading}>
                刷新
              </Button>
              <Button onClick={handleSelectAll} variant="outlined" disabled={loading}>
                {selectedIds.length === items.length ? '取消全选' : '全选'}
              </Button>
              <Button
                onClick={(e) => {
                  console.log('Button clicked!', e);
                  handleGenerate();
                }}
                variant="contained"
                startIcon={<PdfIcon />}
                disabled={selectedIds.length === 0 || generating}
              >
                {generating ? '生成中...' : '生成 PDF'}
              </Button>
              <Button
                onClick={handleGenerateImage}
                variant="contained"
                color="success"
                startIcon={<ImageIcon />}
                disabled={selectedIds.length === 0 || generatingImage}
              >
                {generatingImage ? '生成中...' : '生成图片'}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

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
                maxHeight: 600,
                overflowY: 'auto',
              }}
            >
              {items.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedIds.includes(item.id) ? 2 : 1,
                    borderColor: selectedIds.includes(item.id) ? 'primary.main' : 'divider',
                  }}
                  onClick={() => handleToggle(item.id)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {item.name}
                        </Typography>
                        {item.category && (
                          <Chip label={item.category} size="small" sx={{ mb: 1 }} />
                        )}
                        {item.specifications && (
                          <Typography variant="body2" color="textSecondary">
                            规格: {item.specifications}
                          </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary">
                          库存: {item.quantity} {item.unit || '个'}
                        </Typography>
                      </Box>
                      {selectedIds.includes(item.id) && (
                        <CheckIcon color="success" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>

        {/* Info */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            💡 提示：生成的 PDF 标签包含物品名称、规格、库存、位置信息和二维码。
            选择多个物品可在一张纸上打印多个标签。<br />
            🖼️ 图片标签：生成 PNG 格式的标签图片，包含物料名和二维码，适合快速打印或分享。
            默认 2×2 网格布局（可调整）。
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default Labels;
