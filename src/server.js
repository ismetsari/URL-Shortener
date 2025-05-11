require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const urlRoutes = require('./routes/url.routes');
const { connectToRedis } = require('./config/redis');
const { connectToPostgres } = require('./config/postgres');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to databases
connectToRedis();
connectToPostgres();

// Routes
app.use('/api', urlRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'URL Shortener API' });
});

// Redirect route
app.get('/:shortCode', require('./controllers/url.controller').redirectToUrl);

// Health check endpoints
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Test database connections
    await query('SELECT 1');
    const redis = getRedisClient();
    await redis.ping();
    res.status(200).json({ status: 'READY' });
  } catch (error) {
    res.status(503).json({ status: 'NOT READY' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 