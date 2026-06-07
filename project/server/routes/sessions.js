import express from 'express';
import Session from '../models/Session.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// GET /api/sessions - Get all sessions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      problemId,
      status,
      startDate,
      endDate,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (problemId) filter.problemId = parseInt(problemId);
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sessions = await Session.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Session.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id - Get a specific session
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// GET /api/sessions/active - Get all active sessions
router.get('/status/active', async (req, res) => {
  try {
    const activeSessions = await Session.getActive();
    res.json(activeSessions);

  } catch (error) {
    console.error('❌ Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// GET /api/sessions/completed - Get completed sessions
router.get('/status/completed', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const completedSessions = await Session.getCompleted(parseInt(limit));
    res.json(completedSessions);

  } catch (error) {
    console.error('❌ Error fetching completed sessions:', error);
    res.status(500).json({ error: 'Failed to fetch completed sessions' });
  }
});

// GET /api/sessions/problem/:problemId - Get sessions by problem
router.get('/problem/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const { limit = 50 } = req.query;
    
    const sessions = await Session.getByProblem(parseInt(problemId), parseInt(limit));
    res.json(sessions);

  } catch (error) {
    console.error('❌ Error fetching problem sessions:', error);
    res.status(500).json({ error: 'Failed to fetch problem sessions' });
  }
});

// GET /api/sessions/:id/activities - Get activities for a specific session
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const activities = await Activity.find({ sessionId: session.sessionId })
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.json(activities);

  } catch (error) {
    console.error('❌ Error fetching session activities:', error);
    res.status(500).json({ error: 'Failed to fetch session activities' });
  }
});

// GET /api/sessions/:id/summary - Get session summary
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const summary = session.getSummary();
    res.json(summary);

  } catch (error) {
    console.error('❌ Error fetching session summary:', error);
    res.status(500).json({ error: 'Failed to fetch session summary' });
  }
});

// GET /api/sessions/stats/overview - Get overall session statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Session.getStats();
    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching session stats:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

// GET /api/sessions/top/performers - Get top performing sessions
router.get('/top/performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topPerformers = await Session.getTopPerformers(parseInt(limit));
    res.json(topPerformers);

  } catch (error) {
    console.error('❌ Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// POST /api/sessions - Create a new session
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      problemId,
      metadata
    } = req.body;

    // Validate required fields
    if (!sessionId || !problemId) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, problemId' 
      });
    }

    // Check if session already exists
    const existingSession = await Session.findOne({ sessionId });
    if (existingSession) {
      return res.status(409).json({ error: 'Session already exists' });
    }

    const session = new Session({
      sessionId,
      problemId: parseInt(problemId),
      metadata: metadata || {}
    });

    await session.save();

    res.status(201).json(session);

  } catch (error) {
    console.error('❌ Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:id - Update a session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.sessionId;
    delete updateData.createdAt;

    const session = await Session.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);

  } catch (error) {
    console.error('❌ Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// PUT /api/sessions/:id/end - End a session
router.put('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    await session.endSession();
    res.json(session);

  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// PUT /api/sessions/:id/pause - Pause a session
router.put('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    await session.pauseSession();
    res.json(session);

  } catch (error) {
    console.error('❌ Error pausing session:', error);
    res.status(500).json({ error: 'Failed to pause session' });
  }
});

// PUT /api/sessions/:id/resume - Resume a session
router.put('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({ error: 'Session is not paused' });
    }

    await session.resumeSession();
    res.json(session);

  } catch (error) {
    console.error('❌ Error resuming session:', error);
    res.status(500).json({ error: 'Failed to resume session' });
  }
});

// DELETE /api/sessions/:id - Delete a session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete associated activities first
    await Activity.deleteMany({ sessionId: session.sessionId });
    
    // Delete the session
    await Session.findByIdAndDelete(id);

    res.json({ message: 'Session and associated activities deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// DELETE /api/sessions/cleanup/inactive - Clean up inactive sessions older than specified days
router.delete('/cleanup/inactive', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await Session.deleteMany({
      status: { $in: ['completed', 'disconnected'] },
      endTime: { $lt: cutoffDate }
    });

    res.json({ 
      message: `Cleaned up ${result.deletedCount} inactive sessions older than ${days} days`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Error cleaning up inactive sessions:', error);
    res.status(500).json({ error: 'Failed to clean up inactive sessions' });
  }
});

export default router;
