const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Simple root route
app.get('/', (req, res) => {
  console.log('Root route accessed at:', new Date().toISOString());
  res.status(200).json({
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Simple waitlist endpoint
app.post('/join-waitlist', (req, res) => {
  console.log('Waitlist endpoint accessed:', req.body);
  res.status(200).json({
    success: true,
    message: 'Test waitlist endpoint working',
    data: req.body
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Server started at:', new Date().toISOString());
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app; 