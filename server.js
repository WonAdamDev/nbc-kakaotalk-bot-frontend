import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('='.repeat(50));
console.log('🚀 Starting NBC Basketball Frontend Server');
console.log('='.repeat(50));
console.log('PORT from env:', process.env.PORT);
console.log('PORT to use:', PORT);
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
console.log('\n📁 Checking dist directory...');
console.log('Path:', distPath);
console.log('Dist exists:', existsSync(distPath));
console.log('Index.html exists:', existsSync(join(distPath, 'index.html')));

// Primary health check endpoint for Railway
app.get('/health', (req, res) => {
  console.log('❤️  Health check request received at /health');
  res.status(200).send('OK');
});

// Root path healthcheck - respond immediately for healthchecks, serve app for browsers
app.get('/', (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  const accept = req.get('accept') || '';

  // If this looks like a healthcheck (not a browser), respond immediately
  // Railway/load balancer healthchecks typically don't have browser user-agents
  if (!userAgent.includes('Mozilla') && !accept.includes('text/html')) {
    console.log('🔍 Healthcheck at / - responding quickly');
    return res.status(200).send('OK');
  }

  // Otherwise, serve the React app
  next();
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

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`🌐 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log('='.repeat(50) + '\n');
});

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
