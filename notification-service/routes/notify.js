const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to notification log file
const notificationLogPath = path.join(__dirname, '../logs/notifications.json');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper function to read notifications
function readNotifications() {
  try {
    if (fs.existsSync(notificationLogPath)) {
      const data = fs.readFileSync(notificationLogPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading notifications file:', err);
    return [];
  }
}

// Helper function to save notifications
function saveNotifications(notifications) {
  try {
    fs.writeFileSync(notificationLogPath, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving notifications file:', err);
  }
}

// POST /notify - Receive and process notification
router.post('/', (req, res) => {
  try {
    const { userId, userName, requestId, title, message } = req.body;

    // Validation
    if (!userId || !requestId || !message) {
      return res.status(400).json({
        error: 'userId, requestId, and message are required'
      });
    }

    // Create notification record
    const notification = {
      id: Date.now().toString(),
      userId,
      userName: userName || 'Unknown',
      requestId,
      title: title || 'Notification',
      message,
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    // Save notification
    const notifications = readNotifications();
    notifications.push(notification);
    saveNotifications(notifications);

    // Simulate sending notification (console log for now)
    console.log(`
    📢 NOTIFICATION SENT
    ├─ To: ${userName} (${userId})
    ├─ Request ID: ${requestId}
    ├─ Title: ${title}
    └─ Message: ${message}
    `);

    res.status(200).json({
      status: 'notification_sent',
      message: 'Notification processed successfully',
      notificationId: notification.id,
      sentTo: userName
    });
  } catch (err) {
    console.error('Error processing notification:', err);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

// GET /notify - Get all notifications
router.get('/', (req, res) => {
  try {
    const notifications = readNotifications();
    res.json({
      totalNotifications: notifications.length,
      notifications: notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /notify/:userId - Get notifications for a specific user
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = readNotifications();
    const userNotifications = notifications.filter(n => n.userId === userId);

    res.json({
      userId,
      totalNotifications: userNotifications.length,
      notifications: userNotifications
    });
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
