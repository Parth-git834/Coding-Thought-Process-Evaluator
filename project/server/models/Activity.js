import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  problemId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['typing', 'pseudocode', 'test', 'run', 'refactor', 'debug', 'planning', 'reset'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    codeLength: Number,
    testResults: mongoose.Schema.Types.Mixed,
    errorCount: Number,
    refactorCount: Number,
    lineCount: Number,
    complexity: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ sessionId: 1, timestamp: 1 });
activitySchema.index({ problemId: 1, timestamp: 1 });
activitySchema.index({ type: 1, timestamp: 1 });

// Virtual for formatted timestamp
activitySchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString();
});

// Virtual for activity category
activitySchema.virtual('category').get(function() {
  switch (this.type) {
    case 'typing':
    case 'pseudocode':
      return 'planning';
    case 'test':
    case 'run':
      return 'execution';
    case 'refactor':
    case 'debug':
      return 'improvement';
    default:
      return 'other';
  }
});

// Instance method to get activity summary
activitySchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    description: this.description,
    timestamp: this.timestamp,
    category: this.category,
    metadata: this.metadata
  };
};

// Static method to get activities by session
activitySchema.statics.getBySession = function(sessionId, limit = 100) {
  return this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get activities by problem
activitySchema.statics.getByProblem = function(problemId, limit = 100) {
  return this.find({ problemId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get activity statistics
activitySchema.statics.getStats = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get timeline data
activitySchema.statics.getTimeline = function(sessionId) {
  return this.find({ sessionId })
    .sort({ timestamp: 1 })
    .select('type timestamp description metadata')
    .lean();
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
