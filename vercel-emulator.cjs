import { createServer } from 'http';
import server from './dist/server/server.js';

const port = 3000;
const serverInstance = createServer(async (req, res) => {
  try {
    // Convert Node request to Fetch API Request
    const request = new Request(`http://localhost:${port}${req.url}`, {
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
    console.error(error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

serverInstance.listen(port, () => {
  console.log(`Vercel emulator running on http://localhost:${port}`);
});
