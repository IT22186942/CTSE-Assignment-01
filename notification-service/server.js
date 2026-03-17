const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const notifyRoutes = require('./routes/notify');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/notify', notifyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Notification Service started on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
