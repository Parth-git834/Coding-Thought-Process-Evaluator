import { useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import ProblemStatement from './components/ProblemStatement';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';
import ActivityTimeline from './components/ActivityTimeline';
import ThoughtProcessReport from './components/ThoughtProcessReport';
import { ActivityProvider } from './context/ActivityContext';

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <ActivityProvider>
        <div className="min-h-screen bg-deep-night-50">
          {/* Header */}
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 glass-panel border-b border-white/10"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <motion.h1 
                className="text-2xl font-space-grotesk font-bold text-gradient"
                whileHover={{ scale: 1.05 }}
              >
                Coding Thought Process Analyzer
              </motion.h1>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className="btn-secondary flex items-center space-x-2"
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Main Content - Desktop Optimized Layout */}
          <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* Top Row - Problem Statement and Canvas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel h-80">
                <ProblemStatement />
              </div>
              <div className="glass-panel h-80">
                <Canvas />
              </div>
            </div>
            
            {/* Middle Row - Code Editor */}
            <div className="glass-panel h-[500px]">
              <CodeEditor />
            </div>
            
            {/* Bottom Row - Activity Timeline and Thought Process Report (Larger and Side by Side) */}
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel h-[600px]">
                <ActivityTimeline />
              </div>
              <div className="glass-panel h-[600px]">
                <ThoughtProcessReport />
              </div>
            </div>
          </main>
        </div>
      </ActivityProvider>
  );
}

export default App;
