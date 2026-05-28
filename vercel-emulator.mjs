import { createServer } from 'http';
import server from './dist/server/server.js';

const port = 3000;
const serverInstance = createServer(async (req, res) => {
  try {
    // Convert Node request to Fetch API Request
    const url = new URL(req.url, `http://localhost:${port}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined
    });
    
    const response = await server.fetch(request);
    
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    const body = await response.text();
    res.end(body);
  } catch (error) {
    console.error('Error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

serverInstance.listen(port, () => {
  console.log(`✅ Vercel emulator running on http://localhost:${port}`);
  console.log('Press Ctrl+C to stop');
});
