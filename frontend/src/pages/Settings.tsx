import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { configureWebDAV, configureS3, syncUpload, syncDownload } from '../utils/api';

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [webdavUrl, setWebdavUrl] = useState('');
  const [webdavUsername, setWebdavUsername] = useState('');
  const [webdavPassword, setWebdavPassword] = useState('');
  const [webdavPath, setWebdavPath] = useState('/item-classify-system');

  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('us-east-1');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3Endpoint, setS3Endpoint] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSaveWebDAV = async () => {
    try {
      await configureWebDAV(webdavUrl, webdavUsername, webdavPassword, webdavPath);
      setMessage({ type: 'success', text: 'WebDAV 配置已保存' });
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败: ' + (err as Error).message });
    }
  };

  const handleSaveS3 = async () => {
    try {
      await configureS3(s3Bucket, s3Region, s3AccessKey, s3SecretKey, s3Endpoint || undefined);
      setMessage({ type: 'success', text: 'S3 配置已保存' });
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败: ' + (err as Error).message });
    }
  };

  const handleSync = async (type: 'webdav' | 's3', action: 'upload' | 'download') => {
    setSyncing(true);
    setMessage(null);
    try {
      const result = action === 'upload'
        ? await syncUpload(type)
        : await syncDownload(type);

      setMessage({ type: 'success', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: '同步失败: ' + (err as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        设置
      </Typography>

      <Stack spacing={3}>
        {/* Sync Configuration */}
        <Paper sx={{ p: 2 }}>
          <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
            <Tab label="WebDAV 同步" />
            <Tab label="S3 同步" />
          </Tabs>

          {message && (
            <Alert
              severity={message.type}
              sx={{ my: 2 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {tabValue === 0 && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="h6">WebDAV 配置</Typography>
              <Typography variant="body2" color="textSecondary">
                配置 WebDAV 服务器以同步数据到自建云存储。
              </Typography>
              <TextField
                fullWidth
                label="WebDAV URL"
                placeholder="https://dav.example.com"
                value={webdavUrl}
                onChange={(e) => setWebdavUrl(e.target.value)}
              />
              <TextField
                fullWidth
                label="用户名"
                value={webdavUsername}
                onChange={(e) => setWebdavUsername(e.target.value)}
              />
              <TextField
                fullWidth
                label="密码"
                type="password"
                value={webdavPassword}
                onChange={(e) => setWebdavPassword(e.target.value)}
              />
              <TextField
                fullWidth
                label="路径"
                value={webdavPath}
                onChange={(e) => setWebdavPath(e.target.value)}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSaveWebDAV}
                  disabled={!webdavUrl || !webdavUsername || !webdavPassword}
                >
                  保存配置
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => handleSync('webdav', 'upload')}
                  disabled={syncing || !webdavUrl}
                >
                  {syncing ? <CircularProgress size={20} /> : '上传'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleSync('webdav', 'download')}
                  disabled={syncing || !webdavUrl}
                >
                  {syncing ? <CircularProgress size={20} /> : '下载'}
                </Button>
              </Stack>
            </Stack>
          )}

          {tabValue === 1 && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="h6">AWS S3 / 兼容服务配置</Typography>
              <Typography variant="body2" color="textSecondary">
                配置 AWS S3 或兼容服务（如 MinIO）来存储数据。
              </Typography>
              <TextField
                fullWidth
                label="Bucket 名称"
                placeholder="my-bucket"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
              />
              <TextField
                fullWidth
                label="区域"
                placeholder="us-east-1"
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
              />
              <TextField
                fullWidth
                label="Access Key ID"
                value={s3AccessKey}
                onChange={(e) => setS3AccessKey(e.target.value)}
              />
              <TextField
                fullWidth
                label="Secret Access Key"
                type="password"
                value={s3SecretKey}
                onChange={(e) => setS3SecretKey(e.target.value)}
              />
              <TextField
                fullWidth
                label="自定义端点（可选）"
                placeholder="https://s3.example.com"
                value={s3Endpoint}
                onChange={(e) => setS3Endpoint(e.target.value)}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSaveS3}
                  disabled={!s3Bucket || !s3Region || !s3AccessKey || !s3SecretKey}
                >
                  保存配置
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => handleSync('s3', 'upload')}
                  disabled={syncing || !s3Bucket}
                >
                  {syncing ? <CircularProgress size={20} /> : '上传'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleSync('s3', 'download')}
                  disabled={syncing || !s3Bucket}
                >
                  {syncing ? <CircularProgress size={20} /> : '下载'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>

        {/* Info */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            💡 提示：
            <br />• WebDAV 适用于坚果云、Nextcloud 等支持 WebDAV 协议的网盘
            <br />• S3 适用于 AWS S3、MinIO、阿里云 OSS 等对象存储
            <br />• 数据库文件将被加密后上传
            <br />• 建议定期备份以防止数据丢失
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default Settings;
