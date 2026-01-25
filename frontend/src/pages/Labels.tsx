import { useState, useEffect, useMemo } from 'react';
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
  Slider,
  FormControlLabel,
  FormGroup,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import PreviewIcon from '@mui/icons-material/Preview';
import { getItems, generatePdfLabels, generateImageLabels } from '../utils/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Item } from '../types';
import { LabelPreview, type LabelConfig } from '../components/labels';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

import PageContainer from '../components/PageContainer';

const Labels = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(3);
  const [configTab, setConfigTab] = useState(0);
  
  // New config states
  const [template, setTemplate] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [fontSize, setFontSize] = useState(12);
  const [showFields, setShowFields] = useState({
    name: true,
    specifications: true,
    quantity: true,
    location: true,
    qrCode: true,
  });

  const labelConfig: LabelConfig = useMemo(() => ({
    template,
    fontSize,
    showFields,
    columns,
    rows,
  }), [template, fontSize, showFields, columns, rows]);

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

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

  const handleFieldToggle = (field: keyof typeof showFields) => {
    setShowFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Helper to get checked fields
  const getCheckedFields = () => Object.keys(showFields).filter(key => showFields[key as keyof typeof showFields]);

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setError('请至少选择一个物品');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const pdfData = await generatePdfLabels(
        selectedIds, 
        paperSize, 
        columns, 
        rows,
        template,
        fontSize,
        getCheckedFields()
      );

      const base64Data = pdfData.split(',')[1];
      if (!base64Data) throw new Error('Invalid PDF data format');

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const filePath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `labels_${Date.now()}.pdf`,
      });

      if (filePath) {
        await writeFile(filePath, bytes);
      }
    } catch (err) {
      setError('生成 PDF 失败: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (selectedIds.length === 0) {
      setError('请至少选择一个物品');
      return;
    }

    setGeneratingImage(true);
    setError('');

    try {
      const imageData = await generateImageLabels(
        selectedIds, 
        columns, 
        rows,
        template,
        fontSize,
        getCheckedFields()
      );

      const base64Data = imageData.split(',')[1];
      if (!base64Data) throw new Error('Invalid image data format');

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const filePath = await save({
        filters: [{ name: 'PNG', extensions: ['png'] }],
        defaultPath: `labels_${Date.now()}.png`,
      });

      if (filePath) {
        await writeFile(filePath, bytes);
      }
    } catch (err) {
      setError('生成图片失败: ' + (err as Error).message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDirectPrint = async () => {
    if (selectedIds.length === 0) {
      setError('请至少选择一个物品');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const imageData = await generateImageLabels(
        selectedIds, 
        columns, 
        rows,
        template,
        fontSize,
        getCheckedFields()
      );
      
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, {
        position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none'
      });
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <style>
                @page { margin: 0; size: auto; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${imageData}" onload="window.print();" />
            </body>
          </html>
        `);
        doc.close();
      }
      
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
      
    } catch (err) {
      setError('打印失败: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            标签打印
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Configuration with Tabs */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
            <Tabs value={configTab} onChange={(_, v) => setConfigTab(v)}>
              <Tab icon={<SettingsIcon />} iconPosition="start" label="基本配置" />
              <Tab icon={<PreviewIcon />} iconPosition="start" label="标签样式" />
            </Tabs>
          </Box>

          <TabPanel value={configTab} index={0}>
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
                  <MenuItem value={1}>1 个</MenuItem>
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
                  <MenuItem value={2}>2 个</MenuItem>
                  <MenuItem value={3}>3 个</MenuItem>
                  <MenuItem value={4}>4 个</MenuItem>
                  <MenuItem value={5}>5 个</MenuItem>
                  <MenuItem value={6}>6 个</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TabPanel>

          <TabPanel value={configTab} index={1}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* Left: Style options */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>模板样式</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as typeof template)}
                    size="small"
                  >
                    <MenuItem value="compact">紧凑模式 - 仅显示名称和数量</MenuItem>
                    <MenuItem value="standard">标准模式 - 显示主要信息</MenuItem>
                    <MenuItem value="detailed">详细模式 - 显示所有信息</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  字体大小: {fontSize}pt
                </Typography>
                <Slider
                  value={fontSize}
                  onChange={(_, v) => setFontSize(v as number)}
                  min={8}
                  max={18}
                  step={1}
                  marks={[
                    { value: 8, label: '8' },
                    { value: 12, label: '12' },
                    { value: 18, label: '18' },
                  ]}
                  sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" gutterBottom>显示字段</Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox checked={showFields.name} onChange={() => handleFieldToggle('name')} size="small" />}
                    label="物料名"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={showFields.specifications} onChange={() => handleFieldToggle('specifications')} size="small" />}
                    label="规格"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={showFields.quantity} onChange={() => handleFieldToggle('quantity')} size="small" />}
                    label="数量"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={showFields.location} onChange={() => handleFieldToggle('location')} size="small" />}
                    label="位置"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={showFields.qrCode} onChange={() => handleFieldToggle('qrCode')} size="small" />}
                    label="二维码"
                  />
                </FormGroup>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

              {/* Right: Preview */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <LabelPreview 
                  items={selectedItems}
                  config={labelConfig}
                  paperSize={paperSize}
                  loading={generating}
                />
              </Box>
            </Box>
          </TabPanel>
        </Paper>

        {/* Item Selection */}
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h6">
              选择物品 ({selectedIds.length} / {items.length})
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button onClick={loadItems} startIcon={<RefreshIcon />} disabled={loading} size="small">
                刷新
              </Button>
              <Button onClick={handleSelectAll} variant="outlined" disabled={loading} size="small">
                {selectedIds.length === items.length ? '取消全选' : '全选'}
              </Button>
              <Button
                onClick={handleGenerate}
                variant="contained"
                startIcon={<PdfIcon />}
                disabled={selectedIds.length === 0 || generating}
                size="small"
              >
                {generating ? '生成中...' : '生成 PDF'}
              </Button>
              <Button
                onClick={handleGenerateImage}
                variant="contained"
                color="secondary"
                startIcon={<ImageIcon />}
                disabled={selectedIds.length === 0 || generatingImage}
                size="small"
              >
                {generatingImage ? '生成中...' : '生成图片'}
              </Button>
              <Button
                onClick={handleDirectPrint}
                variant="contained"
                color="success"
                startIcon={<PrintIcon />}
                disabled={selectedIds.length === 0 || generating}
                size="small"
              >
                直接打印
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
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {items.map((item) => (
                <Card
                  key={item.id}
                  variant={selectedIds.includes(item.id) ? "elevation" : "outlined"}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: selectedIds.includes(item.id) ? 'primary.light' : 'background.paper',
                    color: selectedIds.includes(item.id) ? 'primary.dark' : 'text.primary',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: selectedIds.includes(item.id) ? 'primary.light' : 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleToggle(item.id)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{
                          color: selectedIds.includes(item.id) ? 'primary.main' : 'action.disabled',
                          '&.Mui-checked': {
                            color: 'primary.dark',
                          },
                        }}
                      />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        {item.category && (
                          <Chip 
                            label={item.category} 
                            size="small" 
                            sx={{ 
                              my: 0.5, 
                              bgcolor: selectedIds.includes(item.id) ? 'background.paper' : 'default',
                            }} 
                          />
                        )}
                        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                          库存: {item.quantity} {item.unit || '个'}
                        </Typography>
                      </Box>
                      {selectedIds.includes(item.id) && (
                        <CheckIcon color="inherit" fontSize="small" />
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
            💡 <strong>提示</strong>：选择物品后可在"标签样式"标签页中预览效果。
            支持三种模板：紧凑、标准、详细。<br />
            🖨️ <strong>直接打印</strong>：点击后会弹出系统打印对话框，可选择打印机和设置。
          </Typography>
        </Paper>
      </Stack>
    </PageContainer>
  );
};

export default Labels;
