require('dotenv').config();
const logger = require('./utils/logger');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const { mongoSanitize, xssSanitize } = require('./middleware/sanitizer');
const compression = require('compression');

const app = express();

// Connect to database
connectDB();
// Initialize Redis
require('./config/redis');

// Security middleware
app.use(helmet());

// Parse origins from environment variable (comma-separated)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const origins = frontendUrl.split(',').map(url => url.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (origins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssSanitize());

// Compress all responses
app.use(compression());

// Rate limiting removed as per request
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   message: { success: false, error: 'Too many requests, please try again later' }
// });
// app.use('/api', limiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api', require('./routes/settings.routes')); // Settings routes (mixed base path)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
const { errorHandler, notFound } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

const http = require('http');
const socketService = require('./services/socket.service');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    const logger = require('./utils/logger'); // Ensure this is required if not already
    // ... inside server.listen
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Docs available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = server;
