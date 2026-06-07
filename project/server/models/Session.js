import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  problemId: {
    type: Number,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'disconnected'],
    default: 'active',
    index: true
  },
  metadata: {
    totalActivities: {
      type: Number,
      default: 0
    },
    problemDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    },
    programmingLanguage: {
      type: String,
      default: 'javascript'
    },
    userAgent: String,
    ipAddress: String
  },
  performance: {
    methodologyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    efficiencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    problemSolvingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ problemId: 1, startTime: -1 });
sessionSchema.index({ status: 1, startTime: -1 });
sessionSchema.index({ 'performance.methodologyScore': -1 });

// Virtual for session duration in minutes
sessionSchema.virtual('durationMinutes').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }
  return Math.round((Date.now() - this.startTime.getTime()) / 60000);
});

// Virtual for session duration in hours
sessionSchema.virtual('durationHours').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 3600000 * 100) / 100;
  }
  return Math.round((Date.now() - this.startTime.getTime()) / 3600000 * 100) / 100;
});

// Virtual for formatted start time
sessionSchema.virtual('formattedStartTime').get(function() {
  return this.startTime.toLocaleString();
});

// Virtual for formatted end time
sessionSchema.virtual('formattedEndTime').get(function() {
  return this.endTime ? this.endTime.toLocaleString() : 'Active';
});

// Instance method to end session
sessionSchema.methods.endSession = function() {
  this.endTime = new Date();
  this.duration = this.endTime.getTime() - this.startTime.getTime();
  this.status = 'completed';
  return this.save();
};

// Instance method to pause session
sessionSchema.methods.pauseSession = function() {
  this.status = 'paused';
  return this.save();
};

// Instance method to resume session
sessionSchema.methods.resumeSession = function() {
  this.status = 'active';
  return this.save();
};

// Instance method to get session summary
sessionSchema.methods.getSummary = function() {
  return {
    sessionId: this.sessionId,
    problemId: this.problemId,
    status: this.status,
    startTime: this.formattedStartTime,
    endTime: this.formattedEndTime,
    duration: this.durationMinutes,
    performance: this.performance
  };
};

// Static method to get active sessions
sessionSchema.statics.getActive = function() {
  return this.find({ status: 'active' })
    .sort({ startTime: -1 });
};

// Static method to get completed sessions
sessionSchema.statics.getCompleted = function(limit = 50) {
  return this.find({ status: 'completed' })
    .sort({ endTime: -1 })
    .limit(limit);
};

// Static method to get sessions by problem
sessionSchema.statics.getByProblem = function(problemId, limit = 50) {
  return this.find({ problemId })
    .sort({ startTime: -1 })
    .limit(limit);
};

// Static method to get session statistics
sessionSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgDuration: { $avg: '$duration' },
        avgMethodologyScore: { $avg: '$performance.methodologyScore' }
      }
    }
  ]);
};

// Static method to get top performing sessions
sessionSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ 'performance.methodologyScore': -1 })
    .limit(limit)
    .select('sessionId problemId performance startTime duration');
};

// Pre-save middleware to calculate duration if endTime is set
sessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  next();
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
