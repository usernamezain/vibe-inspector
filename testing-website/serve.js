#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const htmlPath = path.resolve(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const content = fs.readFileSync(htmlPath, 'utf-8');
    res.writeHead(200);
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Error loading index.html: ' + String(err));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('====================================================');
  console.log(`  🌐 Testing Website live at: http://127.0.0.1:${PORT}`);
  console.log('====================================================');
  console.log('  1. Open http://127.0.0.1:' + PORT + ' in Google Chrome.');
  console.log('  2. Click the Vibe Inspector extension icon to inspect.');
  console.log('====================================================');
});
