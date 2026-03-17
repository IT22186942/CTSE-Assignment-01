const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to log file
const logFilePath = path.join(__dirname, '../logs/app.log');
const jsonLogsPath = path.join(__dirname, '../logs/logs.json');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper function to read JSON logs
function readJsonLogs() {
  try {
    if (fs.existsSync(jsonLogsPath)) {
      const data = fs.readFileSync(jsonLogsPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading logs file:', err);
    return [];
  }
}

// Helper function to save JSON logs
function saveJsonLogs(logs) {
  try {
    fs.writeFileSync(jsonLogsPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving logs file:', err);
  }
}

// Helper function to append to text log file
function appendTextLog(logMessage) {
  try {
    fs.appendFileSync(logFilePath, logMessage + '\n', 'utf8');
  } catch (err) {
    console.error('Error appending to log file:', err);
  }
}

// POST /log - Receive log entry
router.post('/', (req, res) => {
  try {
    const { service, action, requestId, userId, details, timestamp } = req.body;

    // Validation
    if (!service || !action) {
      return res.status(400).json({
        error: 'service and action are required'
      });
    }

    // Create log entry
    const logEntry = {
      id: Date.now().toString(),
      service,
      action,
      requestId: requestId || 'N/A',
      userId: userId || 'N/A',
      details: details || '',
      timestamp: timestamp || new Date().toISOString()
    };

    // Save to JSON logs
    const logs = readJsonLogs();
    logs.push(logEntry);
    saveJsonLogs(logs);

    // Save to text log file
    const textLog = `[${logEntry.timestamp}] [${service}] ${action} - RequestID: ${requestId}, UserID: ${userId} - ${details}`;
    appendTextLog(textLog);

    // Console log for visibility
    console.log(`
    📝 LOG ENTRY RECORDED
    ├─ Service: ${service}
    ├─ Action: ${action}
    ├─ Request ID: ${requestId}
    ├─ User ID: ${userId}
    └─ Details: ${details}
    `);

    res.status(200).json({
      status: 'log_recorded',
      message: 'Log entry saved successfully',
      logId: logEntry.id
    });
  } catch (err) {
    console.error('Error processing log:', err);
    res.status(500).json({ error: 'Failed to process log' });
  }
});

// GET /log - Get all logs
router.get('/', (req, res) => {
  try {
    const logs = readJsonLogs();
    res.json({
      totalLogs: logs.length,
      logs: logs
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /log/:service - Get logs for a specific service
router.get('/:service', (req, res) => {
  try {
    const { service } = req.params;
    const logs = readJsonLogs();
    const serviceLogs = logs.filter(log => log.service === service);

    res.json({
      service,
      totalLogs: serviceLogs.length,
      logs: serviceLogs
    });
  } catch (err) {
    console.error('Error fetching service logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /log/user/:userId - Get logs for a specific user
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const logs = readJsonLogs();
    const userLogs = logs.filter(log => log.userId === userId);

    res.json({
      userId,
      totalLogs: userLogs.length,
      logs: userLogs
    });
  } catch (err) {
    console.error('Error fetching user logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
