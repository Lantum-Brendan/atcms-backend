//app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./src/utils/logger');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const path = require('path');
const cors = require('cors');
const seedFaculties = require('./src/seed/facultySeed');
const seedUsers = require('./src/seed/userSeed');


// Load environment variables
dotenv.config();

logger.info('Starting ATCMS Backend Server...');

const app = express();

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
// Routes
const authRoutes = require('./src/routes/authRoutes');
const complaintRoutes = require('./src/routes/complaintRoutes');
const transcriptRoutes = require('./src/routes/transcriptRoutes');
const facultyRoutes = require('./src/routes/facultyRoutes')
//this is just some random text i will use to talk about complaints 

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/faculties', facultyRoutes);

// Error handling middleware - must be after all routes
app.use(errorMiddleware);

// Only connect to database if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const connectDB = require('./src/config/db');
    connectDB().then(async () => {
        logger.info('MongoDB connected successfully');
        // Seed faculties and users after successful connection
        await seedFaculties();
        await seedUsers();
    }).catch(err => {
        logger.error('MongoDB connection error:', err);
    });
}

// Export the app for testing
module.exports = app;

// Only start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}