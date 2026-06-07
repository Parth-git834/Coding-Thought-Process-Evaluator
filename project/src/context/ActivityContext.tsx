import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Activity {
  id: string;
  timestamp: Date;
  type: 'typing' | 'pseudocode' | 'test' | 'run' | 'refactor' | 'debug' | 'planning' | 'reset';
  description: string;
  duration?: number;
  metadata?: {
    codeLength?: number;
    testResults?: any;
    errorCount?: number;
    refactorCount?: number;
  };
}

export interface ActivityAnalysis {
  strengths: string[];
  improvements: string[];
  methodology: {
    pseudocodeFirst: boolean;
    testFirst: boolean;
    refactorFrequent: boolean;
    debuggingTime: number;
    codingTime: number;
  };
  score: number;
}

interface ActivityContextType {
  activities: Activity[];
  currentProblem: number;
  isRecording: boolean;
  addActivity: (type: Activity['type'], description: string, metadata?: Activity['metadata']) => void;
  setCurrentProblem: (problemId: number) => void;
  toggleRecording: () => void;
  clearActivities: () => void;
  getAnalysis: () => ActivityAnalysis;
  exportReport: () => void;
  lastCode: string;
  lastLanguage: string;
  lastRunOutput: string;
  lastRunError: string | null;
  setRunResult: (args: { code: string; language: string; output: string; error: string | null }) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: React.ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentProblem, setCurrentProblem] = useState(1);
  const [isRecording, setIsRecording] = useState(true);
  const [lastCode, setLastCode] = useState<string>('');
  const [lastLanguage, setLastLanguage] = useState<string>('javascript');
  const [lastRunOutput, setLastRunOutput] = useState<string>('');
  const [lastRunError, setLastRunError] = useState<string | null>(null);

  const addActivity = useCallback((
    type: Activity['type'], 
    description: string, 
    metadata?: Activity['metadata']
  ) => {
    if (!isRecording) return;

    const newActivity: Activity = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      description,
      metadata,
    };

    setActivities(prev => [...prev, newActivity]);

    // Send to server via REST API
    fetch('http://localhost:5000/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newActivity,
        problemId: currentProblem,
        timestamp: newActivity.timestamp.toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to send activity to server:', error);
    });
  }, [isRecording, currentProblem]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    addActivity(
      isRecording ? 'reset' : 'planning',
      isRecording ? 'Paused activity tracking' : 'Resumed activity tracking'
    );
  }, [isRecording, addActivity]);

  const clearActivities = useCallback(() => {
    setActivities([]);
    addActivity('reset', 'Cleared all activities');
  }, [addActivity]);

  const getAnalysis = useCallback((): ActivityAnalysis => {
    if (activities.length === 0) {
      return {
        strengths: [],
        improvements: [],
        methodology: {
          pseudocodeFirst: false,
          testFirst: false,
          refactorFrequent: false,
          debuggingTime: 0,
          codingTime: 0,
        },
        score: 0,
      };
    }

    const pseudocodeActivities = activities.filter(a => a.type === 'pseudocode');
    const testActivities = activities.filter(a => a.type === 'test');
    const refactorActivities = activities.filter(a => a.type === 'refactor');
    const typingActivities = activities.filter(a => a.type === 'typing');

    const pseudocodeFirst = pseudocodeActivities.length > 0 && 
      pseudocodeActivities[0].timestamp < typingActivities[0]?.timestamp;
    
    const testFirst = testActivities.length > 0 && 
      testActivities[0].timestamp < typingActivities[0]?.timestamp;

    const refactorFrequent = refactorActivities.length >= 2;

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

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (pseudocodeFirst) {
      strengths.push('Excellent job outlining pseudocode before coding');
    } else {
      improvements.push('Consider writing pseudocode before implementing');
    }

    if (testFirst) {
      strengths.push('Great test-first development approach');
    } else {
      improvements.push('Consider running tests earlier in the process');
    }

    if (refactorFrequent) {
      strengths.push('Good refactoring practices');
    } else {
      improvements.push('Consider refactoring code more frequently');
    }

    if (debuggingTime < codingTime * 0.3) {
      strengths.push('Efficient debugging - minimal time spent on errors');
    } else {
      improvements.push('Consider improving code quality to reduce debugging time');
    }

    // Calculate score based on methodology
    let score = 0;
    if (pseudocodeFirst) score += 25;
    if (testFirst) score += 25;
    if (refactorFrequent) score += 20;
    if (debuggingTime < codingTime * 0.3) score += 30;

    return {
      strengths,
      improvements,
      methodology: {
        pseudocodeFirst,
        testFirst,
        refactorFrequent,
        debuggingTime,
        codingTime,
      },
      score,
    };
  }, [activities]);

  const exportReport = useCallback(() => {
    const analysis = getAnalysis();
    const reportData = {
      problemId: currentProblem,
      activities,
      analysis,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coding-analysis-problem-${currentProblem}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentProblem, activities, getAnalysis]);

  const handleProblemChange = useCallback((problemId: number) => {
    setCurrentProblem(problemId);
    setActivities([]);
    addActivity('reset', `Switched to Problem ${problemId}`);
  }, [addActivity]);

  const setRunResult = useCallback((args: { code: string; language: string; output: string; error: string | null }) => {
    setLastCode(args.code);
    setLastLanguage(args.language);
    setLastRunOutput(args.output);
    setLastRunError(args.error);
  }, []);

  const value: ActivityContextType = {
    activities,
    currentProblem,
    isRecording,
    addActivity,
    setCurrentProblem: handleProblemChange,
    toggleRecording,
    clearActivities,
    getAnalysis,
    exportReport,
    lastCode,
    lastLanguage,
    lastRunOutput,
    lastRunError,
    setRunResult,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
