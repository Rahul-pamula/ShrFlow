const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const phasesRoutes = require('./routes/phases');
const tasksRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/phases', phasesRoutes);
app.use('/api/tasks', tasksRoutes);

// Simple health check to avoid "Cannot GET /" confusion
app.get('/', (_req, res) => {
  res.status(200).send('Phase Tracker API is running');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phase-tracker';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
