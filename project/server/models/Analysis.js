import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
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
  totalActivities: {
    type: Number,
    default: 0
  },
  strengths: [{
    type: String,
    required: true
  }],
  improvements: [{
    type: String,
    required: true
  }],
  methodology: {
    pseudocodeFirst: {
      type: Boolean,
      default: false
    },
    testFirst: {
      type: Boolean,
      default: false
    },
    refactorFrequent: {
      type: Boolean,
      default: false
    },
    debuggingTime: {
      type: Number, // in milliseconds
      default: 0
    },
    codingTime: {
      type: Number, // in milliseconds
      default: 0
    }
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  metrics: {
    typingSpeed: {
      type: Number,
      default: 0
    },
    focusScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    efficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    problemSolvingApproach: {
      type: String,
      enum: ['systematic', 'trial_and_error', 'mixed'],
      default: 'mixed'
    }
  },
  patterns: {
    planningTime: {
      type: Number,
      default: 0
    },
    implementationTime: {
      type: Number,
      default: 0
    },
    testingTime: {
      type: Number,
      default: 0
    },
    debuggingTime: {
      type: Number,
      default: 0
    },
    refactoringTime: {
      type: Number,
      default: 0
    }
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['strength', 'improvement', 'suggestion'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analysisSchema.index({ problemId: 1, score: -1 });
analysisSchema.index({ timestamp: -1 });
analysisSchema.index({ 'methodology.pseudocodeFirst': 1, score: -1 });

// Virtual for score category
analysisSchema.virtual('scoreCategory').get(function() {
  if (this.score >= 90) return 'Exceptional';
  if (this.score >= 80) return 'Excellent';
  if (this.score >= 70) return 'Good';
  if (this.score >= 60) return 'Fair';
  if (this.score >= 50) return 'Needs Improvement';
  return 'Poor';
});

// Virtual for score color
analysisSchema.virtual('scoreColor').get(function() {
  if (this.score >= 80) return 'green';
  if (this.score >= 60) return 'yellow';
  if (this.score >= 40) return 'orange';
  return 'red';
});

// Virtual for methodology efficiency
analysisSchema.virtual('methodologyEfficiency').get(function() {
  const { methodology } = this;
  let efficiency = 0;
  
  if (methodology.pseudocodeFirst) efficiency += 25;
  if (methodology.testFirst) efficiency += 25;
  if (methodology.refactorFrequent) efficiency += 20;
  
  const debugRatio = methodology.debuggingTime / (methodology.codingTime + methodology.debuggingTime);
  if (debugRatio < 0.3) efficiency += 30;
  
  return efficiency;
});

// Instance method to get analysis summary
analysisSchema.methods.getSummary = function() {
  return {
    sessionId: this.sessionId,
    problemId: this.problemId,
    score: this.score,
    scoreCategory: this.scoreCategory,
    totalActivities: this.totalActivities,
    strengths: this.strengths,
    improvements: this.improvements,
    methodology: this.methodology,
    timestamp: this.timestamp
  };
};

// Instance method to get detailed analysis
analysisSchema.methods.getDetailed = function() {
  return {
    ...this.getSummary(),
    metrics: this.metrics,
    patterns: this.patterns,
    recommendations: this.recommendations,
    methodologyEfficiency: this.methodologyEfficiency
  };
};

// Static method to get top analyses
analysisSchema.statics.getTopAnalyses = function(limit = 10) {
  return this.find()
    .sort({ score: -1 })
    .limit(limit)
    .select('sessionId problemId score strengths methodology timestamp');
};

// Static method to get analyses by problem
analysisSchema.statics.getByProblem = function(problemId, limit = 50) {
  return this.find({ problemId })
    .sort({ score: -1 })
    .limit(limit);
};

// Static method to get analyses by score range
analysisSchema.statics.getByScoreRange = function(minScore, maxScore, limit = 50) {
  return this.find({
    score: { $gte: minScore, $lte: maxScore }
  })
    .sort({ score: -1 })
    .limit(limit);
};

// Static method to get analysis statistics
analysisSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' },
        avgActivities: { $avg: '$totalActivities' },
        pseudocodeFirstCount: {
          $sum: { $cond: ['$methodology.pseudocodeFirst', 1, 0] }
        },
        testFirstCount: {
          $sum: { $cond: ['$methodology.testFirst', 1, 0] }
        },
        refactorFrequentCount: {
          $sum: { $cond: ['$methodology.refactorFrequent', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get methodology insights
analysisSchema.statics.getMethodologyInsights = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$problemId',
        avgScore: { $avg: '$score' },
        totalSessions: { $sum: 1 },
        pseudocodeFirstRate: {
          $avg: { $cond: ['$methodology.pseudocodeFirst', 1, 0] }
        },
        testFirstRate: {
          $avg: { $cond: ['$methodology.testFirst', 1, 0] }
        },
        refactorFrequentRate: {
          $avg: { $cond: ['$methodology.refactorFrequent', 1, 0] }
        }
      }
    },
    { $sort: { avgScore: -1 } }
  ]);
};

// Pre-save middleware to calculate additional metrics
analysisSchema.pre('save', function(next) {
  // Calculate methodology efficiency
  this.metrics.efficiency = this.methodologyEfficiency;
  
  // Determine problem solving approach
  if (this.methodology.pseudocodeFirst && this.methodology.testFirst) {
    this.metrics.problemSolvingApproach = 'systematic';
  } else if (!this.methodology.pseudocodeFirst && !this.methodology.testFirst) {
    this.metrics.problemSolvingApproach = 'trial_and_error';
  } else {
    this.metrics.problemSolvingApproach = 'mixed';
  }
  
  next();
});

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
