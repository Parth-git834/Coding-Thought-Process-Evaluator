import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Analysis from '../models/Analysis.js';
import Activity from '../models/Activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// GET /api/analysis - Get all analyses with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      problemId,
      minScore,
      maxScore,
      startDate,
      endDate,
      sortBy = 'score',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (problemId) filter.problemId = parseInt(problemId);
    if (minScore || maxScore) {
      filter.score = {};
      if (minScore) filter.score.$gte = parseInt(minScore);
      if (maxScore) filter.score.$lte = parseInt(maxScore);
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const analyses = await Analysis.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Analysis.countDocuments(filter);

    res.json({
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// GET /api/analysis/:id - Get a specific analysis
router.get('/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);

  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// GET /api/analysis/session/:sessionId - Get analysis by session ID
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analysis = await Analysis.findOne({ sessionId });
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found for this session' });
    }

    res.json(analysis);

  } catch (error) {
    console.error('❌ Error fetching session analysis:', error);
    res.status(500).json({ error: 'Failed to fetch session analysis' });
  }
});

// GET /api/analysis/problem/:problemId - Get analyses by problem
router.get('/problem/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const { limit = 50, sortBy = 'score', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const analyses = await Analysis.getByProblem(parseInt(problemId), parseInt(limit));
    res.json(analyses);

  } catch (error) {
    console.error('❌ Error fetching problem analyses:', error);
    res.status(500).json({ error: 'Failed to fetch problem analyses' });
  }
});

// GET /api/analysis/score-range/:minScore/:maxScore - Get analyses by score range
router.get('/score-range/:minScore/:maxScore', async (req, res) => {
  try {
    const { minScore, maxScore } = req.params;
    const { limit = 50 } = req.query;

    const analyses = await Analysis.getByScoreRange(
      parseInt(minScore), 
      parseInt(maxScore), 
      parseInt(limit)
    );
    
    res.json(analyses);

  } catch (error) {
    console.error('❌ Error fetching analyses by score range:', error);
    res.status(500).json({ error: 'Failed to fetch analyses by score range' });
  }
});

// GET /api/analysis/top/:limit - Get top analyses
router.get('/top/:limit', async (req, res) => {
  try {
    const { limit } = req.params;
    const topAnalyses = await Analysis.getTopAnalyses(parseInt(limit));
    res.json(topAnalyses);

  } catch (error) {
    console.error('❌ Error fetching top analyses:', error);
    res.status(500).json({ error: 'Failed to fetch top analyses' });
  }
});

// GET /api/analysis/stats/overview - Get overall analysis statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Analysis.getStats();
    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching analysis stats:', error);
    res.status(500).json({ error: 'Failed to fetch analysis statistics' });
  }
});

// GET /api/analysis/methodology/insights - Get methodology insights
router.get('/methodology/insights', async (req, res) => {
  try {
    const insights = await Analysis.getMethodologyInsights();
    res.json(insights);

  } catch (error) {
    console.error('❌ Error fetching methodology insights:', error);
    res.status(500).json({ error: 'Failed to fetch methodology insights' });
  }
});

// POST /api/analysis - Create a new analysis
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      problemId,
      totalActivities,
      strengths,
      improvements,
      methodology,
      score,
      metrics,
      patterns,
      recommendations
    } = req.body;

    // Validate required fields
    if (!sessionId || !problemId) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, problemId' 
      });
    }

    // Check if analysis already exists for this session
    const existingAnalysis = await Analysis.findOne({ sessionId });
    if (existingAnalysis) {
      return res.status(409).json({ error: 'Analysis already exists for this session' });
    }

    const analysis = new Analysis({
      sessionId,
      problemId: parseInt(problemId),
      totalActivities: totalActivities || 0,
      strengths: strengths || [],
      improvements: improvements || [],
      methodology: methodology || {},
      score: score || 0,
      metrics: metrics || {},
      patterns: patterns || {},
      recommendations: recommendations || []
    });

    await analysis.save();

    res.status(201).json(analysis);

  } catch (error) {
    console.error('❌ Error creating analysis:', error);
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

// PUT /api/analysis/:id - Update an analysis
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.sessionId;
    delete updateData.createdAt;

    const analysis = await Analysis.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);

  } catch (error) {
    console.error('❌ Error updating analysis:', error);
    res.status(500).json({ error: 'Failed to update analysis' });
  }
});

// PUT /api/analysis/session/:sessionId - Update analysis by session ID
router.put('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.sessionId;
    delete updateData.createdAt;

    const analysis = await Analysis.findOneAndUpdate(
      { sessionId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found for this session' });
    }

    res.json(analysis);

  } catch (error) {
    console.error('❌ Error updating session analysis:', error);
    res.status(500).json({ error: 'Failed to update session analysis' });
  }
});

// DELETE /api/analysis/:id - Delete an analysis
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findByIdAndDelete(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting analysis:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

// DELETE /api/analysis/session/:sessionId - Delete analysis by session ID
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await Analysis.deleteOne({ sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Analysis not found for this session' });
    }

    res.json({ message: 'Analysis deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting session analysis:', error);
    res.status(500).json({ error: 'Failed to delete session analysis' });
  }
});

// POST /api/analysis/generate/:sessionId - Generate analysis from session activities
router.post('/generate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all activities for the session
    const activities = await Activity.find({ sessionId }).sort({ timestamp: 1 });
    
    if (activities.length === 0) {
      return res.status(400).json({ error: 'No activities found for this session' });
    }

    // Generate analysis
    const analysis = await generateAnalysisFromActivities(activities, sessionId);
    
    // Save or update analysis
    const savedAnalysis = await Analysis.findOneAndUpdate(
      { sessionId },
      analysis,
      { upsert: true, new: true, runValidators: true }
    );

    res.json(savedAnalysis);

  } catch (error) {
    console.error('❌ Error generating analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// Helper function to generate analysis from activities
async function generateAnalysisFromActivities(activities, sessionId) {
  const analysis = {
    sessionId,
    problemId: activities[0]?.problemId || 1,
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
    metrics: {
      typingSpeed: 0,
      focusScore: 0,
      efficiency: 0,
      problemSolvingApproach: 'mixed'
    },
    patterns: {
      planningTime: 0,
      implementationTime: 0,
      testingTime: 0,
      debuggingTime: 0,
      refactoringTime: 0
    },
    recommendations: []
  };

  if (activities.length === 0) return analysis;

  // Analyze methodology
  const pseudocodeActivities = activities.filter(a => a.type === 'pseudocode');
  const testActivities = activities.filter(a => a.type === 'test');
  const runActivities = activities.filter(a => a.type === 'run');
  const refactorActivities = activities.filter(a => a.type === 'refactor');
  const debugActivities = activities.filter(a => a.type === 'debug');
  const typingActivities = activities.filter(a => a.type === 'typing');
  const planningActivities = activities.filter(a => a.type === 'planning');

  analysis.methodology.pseudocodeFirst = pseudocodeActivities.length > 0 && 
    pseudocodeActivities[0].timestamp < typingActivities[0]?.timestamp;
  
  analysis.methodology.testFirst = testActivities.length > 0 && 
    testActivities[0].timestamp < typingActivities[0]?.timestamp;

  analysis.methodology.refactorFrequent = refactorActivities.length >= 2;

  // Calculate time spent on different activities
  let debuggingTime = 0;
  let codingTime = 0;
  let planningTime = 0;
  let testingTime = 0;
  let refactoringTime = 0;

  for (let i = 1; i < activities.length; i++) {
    const duration = activities[i].timestamp.getTime() - activities[i-1].timestamp.getTime();
    
    switch (activities[i].type) {
      case 'debug':
        debuggingTime += duration;
        break;
      case 'typing':
        codingTime += duration;
        break;
      case 'pseudocode':
        planningTime += duration;
        break;
      case 'test':
      case 'run':
        testingTime += duration;
        break;
      case 'refactor':
        refactoringTime += duration;
        break;
    }
  }

  analysis.methodology.debuggingTime = debuggingTime;
  analysis.methodology.codingTime = codingTime;
  analysis.patterns.planningTime = planningTime;
  analysis.patterns.implementationTime = codingTime;
  analysis.patterns.testingTime = testingTime;
  analysis.patterns.debuggingTime = debuggingTime;
  analysis.patterns.refactoringTime = refactoringTime;

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

  // Generate recommendations
  if (analysis.strengths.length > 0) {
    analysis.recommendations.push({
      type: 'strength',
      title: 'Keep Up the Good Work',
      description: 'Continue practicing these good habits',
      priority: 'low'
    });
  }

  if (analysis.improvements.length > 0) {
    analysis.improvements.forEach(improvement => {
      analysis.recommendations.push({
        type: 'improvement',
        title: 'Area for Growth',
        description: improvement,
        priority: 'medium'
      });
    });
  }

  // Extract features for Python classifier
  const features = {
    typing_count: typingActivities.length,
    pseudocode_count: pseudocodeActivities.length,
    test_count: testActivities.length,
    run_count: runActivities.length,
    refactor_count: refactorActivities.length,
    debug_count: debugActivities.length,
    planning_count: activities.filter(a => a.type === 'planning').length,
    pseudocode_first: analysis.methodology.pseudocodeFirst ? 1 : 0,
    test_first: analysis.methodology.testFirst ? 1 : 0,
    debugging_time: debuggingTime,
    coding_time: codingTime,
    planning_time: planningTime,
    testing_time: testingTime,
    refactoring_time: refactoringTime,
    error_count: activities.reduce((sum, a) => sum + (a.metadata?.errorCount || 0), 0)
  };

  // Run Scikit-learn predictions
  let mlPredictions = null;
  try {
    mlPredictions = await runClassifierModel(features);
    console.log('✅ ML predictions generated:', mlPredictions);
  } catch (error) {
    console.error('⚠️ Falling back to rule-based analysis. ML prediction failed:', error.message);
  }

  if (mlPredictions) {
    analysis.metrics.problemSolvingApproach = mlPredictions.problemSolvingApproach;
    analysis.metrics.focusScore = mlPredictions.focusScore;
    analysis.metrics.efficiency = mlPredictions.efficiency;
    analysis.metrics.typingSpeed = mlPredictions.typingSpeed;
    analysis.modelInfo = mlPredictions.modelInfo;
  } else {
    analysis.metrics.typingSpeed = typingActivities.length > 0 ? Math.round(typingActivities.length * 5) : 0;
    analysis.metrics.focusScore = Math.max(30, Math.min(100, 100 - (debugActivities.length * 5) - (activities.reduce((sum, a) => sum + (a.metadata?.errorCount || 0), 0) * 2)));
    analysis.metrics.efficiency = analysis.score;
    if (analysis.methodology.pseudocodeFirst && analysis.methodology.testFirst) {
      analysis.metrics.problemSolvingApproach = 'systematic';
    } else if (!analysis.methodology.pseudocodeFirst && !analysis.methodology.testFirst) {
      analysis.metrics.problemSolvingApproach = 'trial_and_error';
    } else {
      analysis.metrics.problemSolvingApproach = 'mixed';
    }
    analysis.modelInfo = 'Rule-based engine';
  }

  return analysis;
}

// Helper function to call the Python script
function runClassifierModel(features) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = join(__dirname, '../classifier.py');
    const child = spawn('python', [pythonScriptPath]);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}. Stderr: ${stderrData}`));
        return;
      }
      try {
        const result = JSON.parse(stdoutData.trim());
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}. Output was: ${stdoutData}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.stdin.write(JSON.stringify(features));
    child.stdin.end();
  });
}

export default router;
