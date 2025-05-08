const { query } = require('../config/postgres');
const { 
  generateShortCode, 
  cacheUrl, 
  getUrlFromCache, 
  isValidUrl,
  incrementClickCount
} = require('../utils/url.utils');

// Create a short URL
exports.createShortUrl = async (req, res) => {
  try {
    const { originalUrl, expiresAt } = req.body;

    // Validate URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid URL provided' 
      });
    }

    // Check if URL already exists in database
    const { rows } = await query(
      'SELECT id, short_code, created_at FROM urls WHERE original_url = $1 LIMIT 1',
      [originalUrl]
    );

    let shortCode;
    
    if (rows.length > 0) {
      // URL already exists, reuse the short code
      shortCode = rows[0].short_code;
    } else {
      // URL doesn't exist, generate a new short code
      shortCode = await generateShortCode();
      
      // Store in PostgreSQL
      await query(
        'INSERT INTO urls (original_url, short_code, expires_at) VALUES ($1, $2, $3)',
        [originalUrl, shortCode, expiresAt]
      );
    }

    // Cache in Redis (update even if it exists to refresh TTL)
    await cacheUrl(shortCode, originalUrl, expiresAt);

    // Create full short URL
    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    return res.status(201).json({
      status: 'success',
      data: {
        id: rows.length > 0 ? rows[0].id : null,
        originalUrl,
        shortUrl,
        shortCode,
        createdAt: rows.length > 0 ? rows[0].created_at : new Date(),
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Could not create short URL' 
    });
  }
};

// Redirect to original URL
exports.redirectToUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    if (!shortCode || shortCode.length !== parseInt(process.env.SHORTCODE_LENGTH || 7)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid short code' 
      });
    }

    // Check Redis cache first
    let originalUrl = await getUrlFromCache(shortCode);
    
    // If not in cache, retrieve from database
    if (!originalUrl) {
      const { rows } = await query(
        'SELECT original_url, expires_at FROM urls WHERE short_code = $1',
        [shortCode]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'URL not found' 
        });
      }
      
      // Check if URL has expired
      if (rows[0].expires_at && new Date(rows[0].expires_at) < new Date()) {
        return res.status(410).json({ 
          status: 'error', 
          message: 'URL has expired' 
        });
      }
      
      originalUrl = rows[0].original_url;
      
      // Cache the result for future lookups
      await cacheUrl(shortCode, originalUrl, rows[0].expires_at);
    }
    
    // Track the click asynchronously
    incrementClickCount(shortCode);
    
    // Insert click data
    const referrer = req.get('Referrer') || null;
    const userAgent = req.get('User-Agent') || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Get URL ID first
    const { rows } = await query(
      'SELECT id FROM urls WHERE short_code = $1',
      [shortCode]
    );
    
    if (rows.length > 0) {
      // Track analytics asynchronously (don't await to improve response time)
      query(
        'INSERT INTO clicks (url_id, referrer, user_agent, ip_address) VALUES ($1, $2, $3, $4)',
        [rows[0].id, referrer, userAgent, ipAddress]
      ).catch(err => console.error('Error recording click:', err));
    }
    
    // Redirect to the original URL
    return res.redirect(originalUrl);
  } catch (error) {
    console.error('Error redirecting to URL:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Could not redirect to URL' 
    });
  }
};

// Get URL statistics
exports.getUrlStats = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const { rows } = await query(
      `SELECT 
        u.id, u.original_url, u.short_code, u.created_at, u.expires_at, u.click_count,
        COUNT(c.id) as total_clicks
      FROM urls u
      LEFT JOIN clicks c ON u.id = c.url_id
      WHERE u.short_code = $1
      GROUP BY u.id`,
      [shortCode]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'URL not found' 
      });
    }
    
    // Get additional Redis click count
    let redisClicks = 0;
    try {
      const redis = require('../config/redis').getRedisClient();
      const cachedCount = await redis.get(`clicks:${shortCode}`);
      redisClicks = cachedCount ? parseInt(cachedCount) : 0;
    } catch (error) {
      console.error('Error getting Redis click count:', error);
    }
    
    const url = rows[0];
    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: url.id,
        originalUrl: url.original_url,
        shortUrl,
        shortCode,
        createdAt: url.created_at,
        expiresAt: url.expires_at,
        clickCount: url.click_count + redisClicks,
        totalClicks: parseInt(url.total_clicks) + redisClicks
      }
    });
  } catch (error) {
    console.error('Error getting URL stats:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Could not get URL statistics' 
    });
  }
}; 