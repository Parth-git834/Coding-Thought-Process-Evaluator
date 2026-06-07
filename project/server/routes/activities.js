import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// GET /api/activities - Get all activities with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sessionId,
      problemId,
      type,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (problemId) filter.problemId = parseInt(problemId);
    if (type) filter.type = type;
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
    const activities = await Activity.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Activity.countDocuments(filter);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/:id - Get a specific activity
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);

  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/activities/session/:sessionId - Get activities by session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const activities = await Activity.find({ sessionId })
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.json(activities);

  } catch (error) {
    console.error('❌ Error fetching session activities:', error);
    res.status(500).json({ error: 'Failed to fetch session activities' });
  }
});

// GET /api/activities/problem/:problemId - Get activities by problem
router.get('/problem/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const { limit = 100, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const activities = await Activity.find({ problemId: parseInt(problemId) })
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.json(activities);

  } catch (error) {
    console.error('❌ Error fetching problem activities:', error);
    res.status(500).json({ error: 'Failed to fetch problem activities' });
  }
});

// GET /api/activities/stats/:sessionId - Get activity statistics for a session
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = await Activity.getStats(sessionId);
    
    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

// GET /api/activities/timeline/:sessionId - Get timeline data for a session
router.get('/timeline/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const timeline = await Activity.getTimeline(sessionId);
    
    res.json(timeline);

  } catch (error) {
    console.error('❌ Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// POST /api/activities - Create a new activity
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      problemId,
      type,
      description,
      metadata,
      timestamp
    } = req.body;

    // Validate required fields
    if (!sessionId || !problemId || !type || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, problemId, type, description' 
      });
    }

    // Validate activity type
    const validTypes = ['typing', 'pseudocode', 'test', 'run', 'refactor', 'debug', 'planning', 'reset'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    const activity = new Activity({
      sessionId,
      problemId: parseInt(problemId),
      type,
      description,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await activity.save();

    res.status(201).json(activity);

  } catch (error) {
    console.error('❌ Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// PUT /api/activities/:id - Update an activity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.sessionId;
    delete updateData.createdAt;

    const activity = await Activity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);

  } catch (error) {
    console.error('❌ Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// DELETE /api/activities/:id - Delete an activity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByIdAndDelete(id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// DELETE /api/activities/session/:sessionId - Delete all activities for a session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await Activity.deleteMany({ sessionId });

    res.json({ 
      message: `Deleted ${result.deletedCount} activities for session ${sessionId}`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Error deleting session activities:', error);
    res.status(500).json({ error: 'Failed to delete session activities' });
  }
});

// GET /api/activities/types/summary - Get summary of activity types
router.get('/types/summary', async (req, res) => {
  try {
    const { sessionId, problemId, startDate, endDate } = req.query;

    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (problemId) filter.problemId = parseInt(problemId);
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const summary = await Activity.aggregate([
      { $match: filter },
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

    res.json(summary);

  } catch (error) {
    console.error('❌ Error fetching activity type summary:', error);
    res.status(500).json({ error: 'Failed to fetch activity type summary' });
  }
});

export default router;
