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
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { getItems, generatePdfLabels } from '../utils/api';
import type { Item } from '../types';

const Labels = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(4);

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
    if (selectedIds.length === 0) {
      setError('请至少选择一个物品');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const pdfData = await generatePdfLabels(selectedIds, paperSize, columns, rows);

      // Download PDF
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `labels_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('生成 PDF 失败: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
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
                onClick={handleGenerate}
                variant="contained"
                startIcon={<PdfIcon />}
                disabled={selectedIds.length === 0 || generating}
              >
                {generating ? '生成中...' : '生成 PDF'}
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
            选择多个物品可在一张纸上打印多个标签。
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default Labels;
