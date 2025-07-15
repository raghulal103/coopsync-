const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', verifyToken, (req, res) => {
  res.json({ message: 'Routes - Coming soon' });
});

module.exports = router;
