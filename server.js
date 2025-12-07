import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
console.log('Checking dist directory:', distPath);
console.log('Dist exists:', existsSync(distPath));
console.log('Index.html exists:', existsSync(join(distPath, 'index.html')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT });
});

// Serve static files from dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true
}));

// SPA fallback - all routes return index.html
app.get('*', (req, res) => {
  console.log('Request:', req.method, req.url);
  const indexPath = join(distPath, 'index.html');

  if (existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
    });
  } else {
    console.error('index.html not found at:', indexPath);
    res.status(500).send('index.html not found');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
