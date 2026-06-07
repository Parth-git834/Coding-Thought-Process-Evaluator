import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import models
import Activity from './models/Activity.js';
import Session from './models/Session.js';
import Analysis from './models/Analysis.js';

// Import routes
import activityRoutes from './routes/activities.js';
import sessionRoutes from './routes/sessions.js';
import analysisRoutes from './routes/analysis.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coding-analyzer';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Routes
app.use('/api/activities', activityRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Activity analysis function
async function analyzeActivities(activities) {
  const analysis = {
    sessionId: activities[0]?.sessionId,
    problemId: activities[0]?.problemId,
    totalActivities: activities.length,
    strengths: [],
    improvements: [],
    methodology: {
      pseudocodeFirst: false,
      testFirst: false,
      refactorFrequent: false,
      debuggingTime: 0,
      codingTime: 0
    },
    score: 0,
    timestamp: new Date()
  };

  if (activities.length === 0) return analysis;

  // Analyze methodology
  const pseudocodeActivities = activities.filter(a => a.type === 'pseudocode');
  const testActivities = activities.filter(a => a.type === 'test');
  const refactorActivities = activities.filter(a => a.type === 'refactor');
  const debugActivities = activities.filter(a => a.type === 'debug');
  const typingActivities = activities.filter(a => a.type === 'typing');

  analysis.methodology.pseudocodeFirst = pseudocodeActivities.length > 0 && 
    pseudocodeActivities[0].timestamp < typingActivities[0]?.timestamp;
  
  analysis.methodology.testFirst = testActivities.length > 0 && 
    testActivities[0].timestamp < typingActivities[0]?.timestamp;

  analysis.methodology.refactorFrequent = refactorActivities.length >= 2;

  // Calculate time spent on different activities
  let debuggingTime = 0;
  let codingTime = 0;

  for (let i = 1; i < activities.length; i++) {
    const duration = activities[i].timestamp.getTime() - activities[i-1].timestamp.getTime();
    if (activities[i].type === 'debug') {
      debuggingTime += duration;
    } else if (activities[i].type === 'typing') {
      codingTime += duration;
    }
  }

  analysis.methodology.debuggingTime = debuggingTime;
  analysis.methodology.codingTime = codingTime;

  // Generate strengths and improvements
  if (analysis.methodology.pseudocodeFirst) {
    analysis.strengths.push('Excellent job outlining pseudocode before coding');
  } else {
    analysis.improvements.push('Consider writing pseudocode before implementing');
  }

  if (analysis.methodology.testFirst) {
    analysis.strengths.push('Great test-first development approach');
  } else {
    analysis.improvements.push('Consider running tests earlier in the process');
  }

  if (analysis.methodology.refactorFrequent) {
    analysis.strengths.push('Good refactoring practices');
  } else {
    analysis.improvements.push('Consider refactoring code more frequently');
  }

  if (debuggingTime < codingTime * 0.3) {
    analysis.strengths.push('Efficient debugging - minimal time spent on errors');
  } else {
    analysis.improvements.push('Consider improving code quality to reduce debugging time');
  }

  // Calculate score
  if (analysis.methodology.pseudocodeFirst) analysis.score += 25;
  if (analysis.methodology.testFirst) analysis.score += 25;
  if (analysis.methodology.refactorFrequent) analysis.score += 20;
  if (debuggingTime < codingTime * 0.3) analysis.score += 30;

  return analysis;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
});
