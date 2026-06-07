import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Code, 
  TestTube, 
  Bug, 
  Zap, 
  RotateCcw, 
  PenTool, 
  Play,
  Search,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useActivity, Activity } from '../context/ActivityContext';

const ActivityTimeline = () => {
  const { activities, isRecording, toggleRecording, clearActivities } = useActivity();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByTime, setGroupByTime] = useState(false);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'typing':
        return <Code className="w-4 h-4 text-neon-blue" />;
      case 'pseudocode':
        return <PenTool className="w-4 h-4 text-neon-purple" />;
      case 'test':
        return <TestTube className="w-4 h-4 text-neon-green" />;
      case 'run':
        return <Play className="w-4 h-4 text-neon-yellow" />;
      case 'refactor':
        return <Zap className="w-4 h-4 text-neon-pink" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'planning':
        return <TrendingUp className="w-4 h-4 text-neon-blue" />;
      case 'reset':
        return <RotateCcw className="w-4 h-4 text-white/50" />;
      default:
        return <Clock className="w-4 h-4 text-white/50" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'typing':
        return 'border-l-neon-blue bg-neon-blue/10';
      case 'pseudocode':
        return 'border-l-neon-purple bg-neon-purple/10';
      case 'test':
        return 'border-l-neon-green bg-neon-green/10';
      case 'run':
        return 'border-l-neon-yellow bg-neon-yellow/10';
      case 'refactor':
        return 'border-l-neon-pink bg-neon-pink/10';
      case 'debug':
        return 'border-l-red-400 bg-red-400/10';
      case 'planning':
        return 'border-l-neon-blue bg-neon-blue/10';
      case 'reset':
        return 'border-l-white/50 bg-white/5';
      default:
        return 'border-l-white/50 bg-white/5';
    }
  };

  const getActivityLabel = (type: Activity['type']) => {
    switch (type) {
      case 'typing':
        return 'Code Writing';
      case 'pseudocode':
        return 'Planning';
      case 'test':
        return 'Testing';
      case 'run':
        return 'Execution';
      case 'refactor':
        return 'Refactoring';
      case 'debug':
        return 'Debugging';
      case 'planning':
        return 'Planning';
      case 'reset':
        return 'Reset';
      default:
        return 'Activity';
    }
  };

  const filteredActivities = useMemo(() => {
    let filtered = activities;
    
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getActivityLabel(activity.type).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [activities, filter, searchTerm]);

  const groupedActivities = useMemo(() => {
    if (!groupByTime) return filteredActivities;
    
    const groups: { [key: string]: Activity[] } = {};
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return groups;
  }, [filteredActivities, groupByTime]);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityStats = () => {
    const total = activities.length;
    const byType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byType };
  };

  const stats = getActivityStats();

    return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <motion.h3 
          className="text-lg font-space-grotesk font-bold text-gradient"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Activity Timeline
        </motion.h3>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-glass-white text-white/70 hover:text-white'
            }`}
            title={isRecording ? 'Recording' : 'Paused'}
          >
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-white/50'}`} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearActivities}
            className="btn-secondary p-2"
            title="Clear all activities"
          >
            <RotateCcw size={16} />
          </motion.button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-4 border-b border-white/10 bg-glass-dark">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-neon-blue">{stats.total}</div>
            <div className="text-xs text-white/70">Total Activities</div>
          </div>
          <div>
            <div className="text-xl font-bold text-neon-purple">{stats.byType.typing || 0}</div>
            <div className="text-xs text-white/70">Code Writing</div>
          </div>
          <div>
            <div className="text-xl font-bold text-neon-green">{stats.byType.test || 0}</div>
            <div className="text-xs text-white/70">Testing</div>
          </div>
          <div>
            <div className="text-xl font-bold text-neon-pink">{stats.byType.refactor || 0}</div>
            <div className="text-xs text-white/70">Refactoring</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 bg-glass-dark">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10 text-sm"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Activities</option>
            <option value="typing">Code Writing</option>
            <option value="pseudocode">Planning</option>
            <option value="test">Testing</option>
            <option value="run">Execution</option>
            <option value="refactor">Refactoring</option>
            <option value="debug">Debugging</option>
            <option value="planning">Planning</option>
            <option value="reset">Reset</option>
          </select>
          
          {/* Group by Time */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGroupByTime(!groupByTime)}
            className={`p-2 rounded-lg transition-all duration-300 ${
              groupByTime ? 'bg-neon-purple text-white' : 'bg-glass-white text-white/70 hover:text-white'
            }`}
            title="Group by time"
          >
            <Calendar size={16} />
          </motion.button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white/50 py-8"
            >
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No activities yet</p>
              <p className="text-sm">Start coding to see your activity timeline</p>
            </motion.div>
          ) : groupByTime ? (
            // Grouped by date
            Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="text-sm font-medium text-white/70 mb-3 px-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="space-y-3">
                  {dayActivities.map((activity: Activity, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative pl-6 py-3 rounded-lg border-l-4 ${getActivityColor(activity.type)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">
                              {getActivityLabel(activity.type)}
                </p>
                            <span className="text-xs text-white/50">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
                          <p className="text-sm text-white/70 mt-1">
                {activity.description}
              </p>
                          {activity.metadata && (
                            <div className="mt-2 text-xs text-white/50">
                              {activity.metadata.codeLength && (
                                <span className="mr-3">Code: {activity.metadata.codeLength} chars</span>
                              )}
                              {activity.metadata.errorCount && (
                                <span className="mr-3">Errors: {activity.metadata.errorCount}</span>
                              )}
                            </div>
                          )}
            </div>
          </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            // Chronological list
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative pl-6 py-3 rounded-lg border-l-4 ${getActivityColor(activity.type)} mb-3`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        {getActivityLabel(activity.type)}
                      </p>
                      <span className="text-xs text-white/50">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mt-1">
                      {activity.description}
                    </p>
                    {activity.metadata && (
                      <div className="mt-2 text-xs text-white/50">
                        {activity.metadata.codeLength && (
                          <span className="mr-3">Code: {activity.metadata.codeLength} chars</span>
                        )}
                        {activity.metadata.errorCount && (
                          <span className="mr-3">Errors: {activity.metadata.errorCount}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityTimeline;