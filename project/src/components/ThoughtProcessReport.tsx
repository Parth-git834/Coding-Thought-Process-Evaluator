import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Target, 
  Clock, 
  Zap, 
  Share2,
  Star,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Timer,
  TestTube,
  PenTool,
  Code,
  Bug,
  Brain,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useActivity } from '../context/ActivityContext';

const ThoughtProcessReport = () => {
  const { activities, getAnalysis, currentProblem, lastCode, lastLanguage, lastRunOutput, lastRunError } = useActivity();
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'code-analysis' | 'timeline' | 'insights'>('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [apiAnalysis, setApiAnalysis] = useState<any>(null);

  const analysis = useMemo(() => getAnalysis(), [getAnalysis]);

  const triggerWorqhatAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const url = 'https://api.worqhat.com/flows/trigger/e9d18f08-4de7-43c0-a516-f1b6c82f140d';
  const apiKey = 'wh_mehxy8qsXh1n2oxBwmsjznMdtnrGmFJ4zSdUMMEYqo4Ss';
      const payload = {
        "timeline": JSON.stringify({ activities })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setApiAnalysis(data);
        console.log('API Analysis Response:', data);
      } else {
        console.error('API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error calling Worqhat API:', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 60) return 'text-neon-yellow';
    if (score >= 40) return 'text-neon-pink';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const getMethodologyData = () => {
    const { methodology } = analysis;
    const totalTime = methodology.codingTime + methodology.debuggingTime;
    
    return [
      {
        name: 'Coding',
        value: methodology.codingTime,
        percentage: totalTime > 0 ? Math.round((methodology.codingTime / totalTime) * 100) : 0,
        color: '#00d4ff'
      },
      {
        name: 'Debugging',
        value: methodology.debuggingTime,
        percentage: totalTime > 0 ? Math.round((methodology.debuggingTime / totalTime) * 100) : 0,
        color: '#ec4899'
      }
    ];
  };

  const getActivityTypeData = () => {
    const typeCounts = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: getTypeColor(type)
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'typing': return '#00d4ff';
      case 'pseudocode': return '#a855f7';
      case 'test': return '#10b981';
      case 'run': return '#f59e0b';
      case 'refactor': return '#ec4899';
      case 'debug': return '#ef4444';
      case 'planning': return '#3b82f6';
      case 'reset': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getTimelineData = () => {
    return activities.map((activity, index) => ({
      time: index,
      type: activity.type,
      timestamp: activity.timestamp,
      description: activity.description
    }));
  };

  const getCodeAnalysis = () => {
    const codeAnalysis = {
      planning: {
        score: 0,
        feedback: '',
        suggestions: [] as string[]
      },
      implementation: {
        score: 0,
        feedback: '',
        suggestions: [] as string[]
      },
      testing: {
        score: 0,
        feedback: '',
        suggestions: [] as string[]
      },
      optimization: {
        score: 0,
        feedback: '',
        suggestions: [] as string[]
      }
    };

    // Analyze planning phase
    const hasPseudocode = activities.some(a => a.type === 'pseudocode');
    
    if (hasPseudocode) {
      codeAnalysis.planning.score = 85;
      codeAnalysis.planning.feedback = 'Excellent planning approach with pseudocode';
      codeAnalysis.planning.suggestions = ['Consider adding more detailed comments in pseudocode'];
    } else {
      codeAnalysis.planning.score = 40;
      codeAnalysis.planning.feedback = 'No pseudocode detected - planning could be improved';
      codeAnalysis.planning.suggestions = [
        'Write pseudocode before implementation',
        'Break down the problem into smaller steps',
        'Consider edge cases in planning phase'
      ];
    }

    // Analyze implementation phase
    const typingActivities = activities.filter(a => a.type === 'typing');
    const refactorActivities = activities.filter(a => a.type === 'refactor');
    
    if (typingActivities.length > 0) {
      codeAnalysis.implementation.score = 70;
      codeAnalysis.implementation.feedback = 'Good implementation approach';
      if (refactorActivities.length > 0) {
        codeAnalysis.implementation.score = 85;
        codeAnalysis.implementation.feedback = 'Excellent implementation with refactoring';
        codeAnalysis.implementation.suggestions = ['Great job refactoring for better code quality'];
      } else {
        codeAnalysis.implementation.suggestions = ['Consider refactoring for better code structure'];
      }
    }

    // Incorporate last run feedback
    if (lastCode) {
      if (lastRunError) {
        codeAnalysis.testing.score = Math.max(codeAnalysis.testing.score, 40);
        codeAnalysis.testing.feedback = 'Run produced an error';
        codeAnalysis.testing.suggestions.push(`Fix runtime error: ${lastRunError}`);
      } else if (lastRunOutput) {
        codeAnalysis.testing.score = Math.max(codeAnalysis.testing.score, 70);
        codeAnalysis.testing.feedback = 'Code executed with output';
        codeAnalysis.testing.suggestions.push('Validate output against edge cases');
      }

      // Quick heuristics on code quality
      const longLines = lastCode.split('\n').filter(l => l.length > 100).length;
      if (longLines > 0) {
        codeAnalysis.optimization.suggestions.push('Break long lines into smaller statements');
      }
      if (/var\s+/.test(lastCode)) {
        codeAnalysis.optimization.suggestions.push('Use let/const instead of var');
      }
      if (/console\.log\(/.test(lastCode)) {
        codeAnalysis.optimization.suggestions.push('Remove debug console logs before final submission');
      }
    }

    // Analyze testing phase
    const testActivities = activities.filter(a => a.type === 'test');
    const runActivities = activities.filter(a => a.type === 'run');
    
    if (testActivities.length > 0) {
      codeAnalysis.testing.score = 80;
      codeAnalysis.testing.feedback = 'Good testing approach';
      codeAnalysis.testing.suggestions = ['Consider writing tests before implementation (TDD)'];
    } else if (runActivities.length > 0) {
      codeAnalysis.testing.score = 60;
      codeAnalysis.testing.feedback = 'Basic testing with code execution';
      codeAnalysis.testing.suggestions = [
        'Write unit tests for your functions',
        'Test edge cases and boundary conditions',
        'Consider test-driven development'
      ];
    } else {
      codeAnalysis.testing.score = 30;
      codeAnalysis.testing.feedback = 'No testing detected';
      codeAnalysis.testing.suggestions = [
        'Always test your code before considering it complete',
        'Write automated tests',
        'Test with different input scenarios'
      ];
    }

    // Analyze optimization phase
    const totalTime = analysis.methodology.codingTime + analysis.methodology.debuggingTime;
    const debugRatio = totalTime > 0 ? analysis.methodology.debuggingTime / totalTime : 0;
    
    if (debugRatio < 0.2) {
      codeAnalysis.optimization.score = 90;
      codeAnalysis.optimization.feedback = 'Excellent - minimal debugging needed';
      codeAnalysis.optimization.suggestions = ['Great code quality and planning!'];
    } else if (debugRatio < 0.4) {
      codeAnalysis.optimization.score = 70;
      codeAnalysis.optimization.feedback = 'Good - reasonable debugging time';
      codeAnalysis.optimization.suggestions = ['Consider improving initial code quality'];
    } else {
      codeAnalysis.optimization.score = 50;
      codeAnalysis.optimization.feedback = 'High debugging time - room for improvement';
      codeAnalysis.optimization.suggestions = [
        'Improve planning and pseudocode',
        'Write cleaner initial code',
        'Test more thoroughly before debugging'
      ];
    }

    return codeAnalysis;
  };

  const getRecommendations = () => {
    const recommendations = [];
    const codeAnalysis = getCodeAnalysis();
    
    // Add code analysis recommendations
    Object.entries(codeAnalysis).forEach(([phase, analysis]) => {
      if (analysis.score < 70) {
        recommendations.push({
          type: 'warning',
          title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Needs Improvement`,
          description: analysis.feedback,
          icon: AlertCircle
        });
      } else if (analysis.score >= 85) {
        recommendations.push({
          type: 'success',
          title: `Excellent ${phase.charAt(0).toUpperCase() + phase.slice(1)}`,
          description: analysis.feedback,
          icon: CheckCircle
        });
      }
    });
    
    if (analysis.methodology.debuggingTime > analysis.methodology.codingTime * 0.5) {
      recommendations.push({
        type: 'warning',
        title: 'High Debugging Time',
        description: 'Consider improving code quality and planning to reduce debugging time.',
        icon: Bug
      });
    }
    
    if (!analysis.methodology.pseudocodeFirst) {
      recommendations.push({
        type: 'info',
        title: 'Planning First',
        description: 'Try writing pseudocode before implementing to improve code structure.',
        icon: Brain
      });
    }
    
    if (!analysis.methodology.testFirst) {
      recommendations.push({
        type: 'info',
        title: 'Test-Driven Development',
        description: 'Consider writing tests before implementation for better code quality.',
        icon: TestTube
      });
    }
    
    if (analysis.methodology.refactorFrequent) {
      recommendations.push({
        type: 'success',
        title: 'Good Refactoring',
        description: 'Excellent job refactoring code regularly. Keep it up!',
        icon: CheckCircle
      });
    }
    
    return recommendations;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'methodology', label: 'Methodology', icon: TrendingUp },
    { id: 'code-analysis', label: 'Code Analysis', icon: Code },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  // Use API analysis if available, otherwise use local analysis
  const currentAnalysis = apiAnalysis?.analysis?.[0] || analysis;
  const currentCodeAnalysis = apiAnalysis?.analysis?.[0]?.codeAnalysis || getCodeAnalysis();
  const currentRecommendations = apiAnalysis?.analysis?.[0]?.recommendations || getRecommendations();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <motion.h3 
          className="text-lg font-space-grotesk font-bold text-gradient"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Thought Process Report
        </motion.h3>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerWorqhatAnalysis}
            disabled={isLoadingAnalysis}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            {isLoadingAnalysis ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Brain size={16} />
            )}
            <span>{isLoadingAnalysis ? 'Analyzing...' : 'Get Analysis'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            {showDetails ? <Target size={16} /> : <Share2 size={16} />}
            <span>{showDetails ? 'Summary' : 'Details'}</span>
          </motion.button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="p-4 border-b border-white/10 bg-glass-dark">
        <div className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-neon-yellow" />
              <span className="text-white/70 text-sm">Methodology Score</span>
            </div>
            {apiAnalysis && (
              <div className="text-xs text-neon-green bg-neon-green/10 px-2 py-1 rounded">
                AI Analysis
              </div>
            )}
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(Number(currentAnalysis.score))}`}>
            {currentAnalysis.score}/100
          </div>
          <div className="text-white/70 text-sm">{getScoreLabel(Number(currentAnalysis.score))}</div>
        </div>
      </div>
            
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 p-3 text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'text-neon-purple border-b-2 border-neon-purple'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="card">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-neon-green" />
                    <h4 className="text-lg font-medium text-white">Strengths</h4>
                  </div>
                  {currentAnalysis.strengths?.length > 0 ? (
                    <ul className="space-y-2">
                      {currentAnalysis.strengths.map((strength: string, index: number) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-2 text-white/80"
                        >
                          <Star className="w-4 h-4 text-neon-yellow mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/50 text-sm">No specific strengths identified yet.</p>
                  )}
                </div>
            
                {/* Improvements */}
                <div className="card">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-neon-pink" />
                    <h4 className="text-lg font-medium text-white">Areas for Improvement</h4>
                  </div>
                  {currentAnalysis.improvements?.length > 0 ? (
                    <ul className="space-y-2">
                      {currentAnalysis.improvements.map((improvement: string, index: number) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-2 text-white/80"
                        >
                          <Lightbulb className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/50 text-sm">Great job! No major improvements needed.</p>
                  )}
                </div>
              </div>

              {/* Activity Distribution */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Activity Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getActivityTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getActivityTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'methodology' && (
            <motion.div
              key="methodology"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Methodology Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <PenTool className="w-5 h-5 text-neon-purple" />
                    <span className="text-white/70 text-sm">Pseudocode First</span>
                  </div>
                  <div className={`text-2xl font-bold ${currentAnalysis.methodology?.pseudocodeFirst ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {currentAnalysis.methodology?.pseudocodeFirst ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="card text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TestTube className="w-5 h-5 text-neon-green" />
                    <span className="text-white/70 text-sm">Test First</span>
                  </div>
                  <div className={`text-2xl font-bold ${currentAnalysis.methodology?.testFirst ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {currentAnalysis.methodology?.testFirst ? 'Yes' : 'No'}
                  </div>
                </div>
                
                <div className="card text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-neon-pink" />
                    <span className="text-white/70 text-sm">Refactor Often</span>
                  </div>
                  <div className={`text-2xl font-bold ${currentAnalysis.methodology?.refactorFrequent ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {currentAnalysis.methodology?.refactorFrequent ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="card text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Timer className="w-5 h-5 text-neon-blue" />
                    <span className="text-white/70 text-sm">Efficient Debug</span>
                  </div>
                  <div className={`text-2xl font-bold ${Number(currentAnalysis.methodology?.debuggingTime) < Number(currentAnalysis.methodology?.codingTime) * 0.3 ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {Number(currentAnalysis.methodology?.debuggingTime) < Number(currentAnalysis.methodology?.codingTime) * 0.3 ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Time Distribution Chart */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Time Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getMethodologyData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="name" stroke="#ffffff70" />
                      <YAxis stroke="#ffffff70" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a2e', 
                          border: '1px solid #ffffff20',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'code-analysis' && (
            <motion.div
              key="code-analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Code Analysis Overview */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(currentCodeAnalysis).map(([phase, analysis]: [string, any]) => (
                  <div key={phase} className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      {phase === 'planning' && <Brain className="w-5 h-5 text-neon-purple" />}
                      {phase === 'implementation' && <Code className="w-5 h-5 text-neon-blue" />}
                      {phase === 'testing' && <TestTube className="w-5 h-5 text-neon-green" />}
                      {phase === 'optimization' && <Zap className="w-5 h-5 text-neon-yellow" />}
                      <h4 className="text-lg font-medium text-white capitalize">{phase}</h4>
                    </div>
                    
                    <div className="text-center mb-3">
                      <div className={`text-3xl font-bold ${getScoreColor(Number(analysis.score))}`}>
                        {analysis.score}/100
                      </div>
                      <div className="text-sm text-white/70">{getScoreLabel(Number(analysis.score))}</div>
                    </div>
                    
                    <div className="w-full bg-glass-dark rounded-full h-2 mb-3">
                      <motion.div
                        className={`h-2 rounded-full ${
                          Number(analysis.score) >= 80 ? 'bg-neon-green' :
                          Number(analysis.score) >= 60 ? 'bg-neon-yellow' :
                          Number(analysis.score) >= 40 ? 'bg-neon-pink' : 'bg-red-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    <p className="text-sm text-white/80 mb-3">{analysis.feedback}</p>
                    
                    {analysis.suggestions?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Suggestions:</h5>
                        <ul className="space-y-1">
                          {analysis.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-xs text-white/70 flex items-start space-x-2">
                              <Lightbulb className="w-3 h-3 text-neon-blue mt-0.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Last Run Snapshot */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-2">Last Run Snapshot</h4>
                {lastCode ? (
                  <div className="space-y-3">
                    <div className="text-xs text-white/60">Language: <span className="text-white">{lastLanguage}</span></div>
                    {lastRunError ? (
                      <div>
                        <div className="text-neon-pink text-sm mb-1">Error</div>
                        <pre className="bg-red-900/20 p-2 rounded text-xs whitespace-pre-wrap">{lastRunError}</pre>
                      </div>
                    ) : (
                      <div>
                        <div className="text-neon-green text-sm mb-1">Console Output</div>
                        <pre className="bg-glass-white p-2 rounded text-xs whitespace-pre-wrap">{lastRunOutput || 'No output'}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">Run your code in the editor to see a snapshot here.</div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Timeline Chart */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Activity Timeline</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getTimelineData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="time" stroke="#ffffff70" />
                      <YAxis stroke="#ffffff70" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a2e', 
                          border: '1px solid #ffffff20',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="time" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Recent Activities</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.slice(-10).reverse().map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3 p-3 bg-glass-dark rounded-lg"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTypeColor(activity.type) || '#9ca3af' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.description}</p>
                        <p className="text-xs text-white/50">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recommendations */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Recommendations</h4>
                <div className="space-y-4">
                  {currentRecommendations.map((rec: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start space-x-3 p-4 rounded-lg ${
                        rec.type === 'success' ? 'bg-neon-green/10 border border-neon-green/20' :
                        rec.type === 'warning' ? 'bg-neon-pink/10 border border-neon-pink/20' :
                        'bg-neon-blue/10 border border-neon-blue/20'
                      }`}
                    >
                      {rec.icon === 'check_circle' ? (
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-neon-green" />
                      ) : rec.icon === 'warning' ? (
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-neon-pink" />
                      ) : (
                        <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-neon-blue" />
                      )}
                      <div>
                        <h5 className="font-medium text-white mb-1">{rec.title}</h5>
                        <p className="text-sm text-white/70">{rec.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Problem Context */}
              <div className="card">
                <h4 className="text-lg font-medium text-white mb-4">Problem Context</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Problem ID:</span>
                    <span className="text-white font-medium">#{currentProblem}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Total Activities:</span>
                    <span className="text-white font-medium">{activities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Session Duration:</span>
                    <span className="text-white font-medium">
                      {activities.length > 1 
                        ? Math.round((activities[activities.length - 1].timestamp.getTime() - activities[0].timestamp.getTime()) / 60000)
                        : 0}m
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ThoughtProcessReport;
