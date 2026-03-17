const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const requestRoutes = require('./routes/request');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/request', requestRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Request Service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Request Service started on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
