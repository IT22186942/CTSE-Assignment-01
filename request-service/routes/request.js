const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// File-based database for requests
const dbPath = path.join(__dirname, '../db/requests.json');

// Helper function to read requests
function readRequests() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading requests file:', err);
    return [];
  }
}

// Helper function to save requests
function saveRequests(requests) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving requests file:', err);
  }
}

// Helper function to call another microservice
async function callService(url, data) {
  try {
    const response = await axios.post(url, data, {
      timeout: 5000
    });
    return response.data;
  } catch (err) {
    console.error(`Error calling service ${url}:`, err.message);
    return { error: err.message };
  }
}

// POST /request - Create a new service request (requires auth)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, type } = req.body;

    // Simple validation
    if (!title || !description || !type) {
      return res.status(400).json({
        error: 'Title, description, and type are required'
      });
    }

    // Create new request
    const newRequest = {
      id: Date.now().toString(),
      userId: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      title,
      description,
      type, // e.g., 'maintenance', 'repair', 'facility'
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save to database
    const requests = readRequests();
    requests.push(newRequest);
    saveRequests(requests);

    // Call Notification Service to send notification
    const notificationPayload = {
      userId: newRequest.userId,
      userName: newRequest.userName,
      requestId: newRequest.id,
      title: newRequest.title,
      message: `New service request created: ${newRequest.title}`
    };

    console.log('📤 Calling Notification Service...');
    const notifyResult = await callService(
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003/notify',
      notificationPayload
    );
    console.log('✓ Notification Service response:', notifyResult);

    // Call Logging Service to log this activity
    const logPayload = {
      service: 'request-service',
      action: 'create_request',
      requestId: newRequest.id,
      userId: newRequest.userId,
      details: `User ${newRequest.userName} created request: ${newRequest.title}`,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Calling Logging Service...');
    const logResult = await callService(
      process.env.LOGGING_SERVICE_URL || 'http://localhost:3004/log',
      logPayload
    );
    console.log('✓ Logging Service response:', logResult);

    res.status(201).json({
      message: 'Request created successfully',
      request: newRequest,
      notificationStatus: notifyResult?.status || 'pending',
      loggingStatus: logResult?.status || 'pending'
    });
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /request/:userId - Get all requests for a user (requires auth)
router.get('/:userId', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own requests or is admin
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const requests = readRequests();
    const userRequests = requests.filter(r => r.userId === userId);

    res.json({
      userId,
      totalRequests: userRequests.length,
      requests: userRequests
    });
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /request - Get all requests (for admins, no auth required for now)
router.get('/', (req, res) => {
  try {
    const requests = readRequests();
    res.json({
      totalRequests: requests.length,
      requests: requests
    });
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

module.exports = router;
