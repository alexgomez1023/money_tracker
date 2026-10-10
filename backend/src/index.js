import { createServer } from 'node:http';

const port = process.env.PORT || 3000;

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
