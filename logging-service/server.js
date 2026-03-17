const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const logRoutes = require('./routes/log');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/log', logRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Logging Service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Logging Service started on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
