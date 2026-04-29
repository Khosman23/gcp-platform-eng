const http = require('http');

const PORT = process.env.PORT || 8080;
const VERSION = process.env.VERSION || '1.0.0';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Hello from GCP Platform Engineering!',
      version: VERSION,
      environment: ENVIRONMENT,
      timestamp: new Date().toISOString(),
      project: 'platform-eng-portfolio'
    }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`API Service running on port ${PORT}`);
});
