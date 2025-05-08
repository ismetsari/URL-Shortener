const { nanoid } = require('nanoid');
const { getRedisClient } = require('../config/redis');
const { query } = require('../config/postgres');

// Generate a unique short code
const generateShortCode = async () => {
  const shortCodeLength = parseInt(process.env.SHORTCODE_LENGTH || 7);
  let shortCode = nanoid(shortCodeLength);
  
  // Check if shortCode exists in database to ensure uniqueness
  const { rows } = await query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
  
  // If exists, recursively generate a new one (very rare case)
  if (rows.length > 0) {
    return generateShortCode();
  }
  
  return shortCode;
};

// Cache URL in Redis
const cacheUrl = async (shortCode, originalUrl, expiresAt) => {
  try {
    const redis = getRedisClient();
    const ttl = expiresAt ? Math.floor((new Date(expiresAt) - new Date()) / 1000) : 60 * 60 * 24 * 7; // Default 7 days
    
    // Cache the mapping of shortCode -> originalUrl
    await redis.set(`url:${shortCode}`, originalUrl, { EX: ttl > 0 ? ttl : 3600 });
    
    return true;
  } catch (error) {
    console.error('Redis caching error:', error);
    return false;
  }
};

// Get URL from cache
const getUrlFromCache = async (shortCode) => {
  try {
    const redis = getRedisClient();
    return await redis.get(`url:${shortCode}`);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Increment click count in Redis (for eventual consistency)
const incrementClickCount = async (shortCode) => {
  try {
    const redis = getRedisClient();
    await redis.incr(`clicks:${shortCode}`);
    
    // If count reaches threshold, update database and reset counter
    const count = parseInt(await redis.get(`clicks:${shortCode}`));
    if (count >= 10) { // Batch update to reduce DB writes
      await updateDbClickCount(shortCode, count);
      await redis.set(`clicks:${shortCode}`, 0);
    }
  } catch (error) {
    console.error('Error incrementing click count:', error);
  }
};

// Update database with accumulated click count
const updateDbClickCount = async (shortCode, count) => {
  try {
    await query(
      'UPDATE urls SET click_count = click_count + $1 WHERE short_code = $2',
      [count, shortCode]
    );
  } catch (error) {
    console.error('Database update error:', error);
  }
};

module.exports = {
  generateShortCode,
  cacheUrl,
  getUrlFromCache,
  isValidUrl,
  incrementClickCount
}; 