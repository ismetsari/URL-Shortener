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