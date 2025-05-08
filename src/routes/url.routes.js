const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');

// Create a short URL
router.post('/urls', urlController.createShortUrl);

// Get URL statistics
router.get('/urls/:shortCode/stats', urlController.getUrlStats);

module.exports = router; 