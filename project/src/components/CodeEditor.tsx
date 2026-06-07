import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Code, TestTube, Zap, Save, Download, Lightbulb } from 'lucide-react';
import { useActivity } from '../context/ActivityContext';
import Editor from '@monaco-editor/react';

const CodeEditor = () => {
  const { addActivity, currentProblem, setRunResult } = useActivity();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const editorRef = useRef<any>(null);
  const lastCodeLength = useRef(0);

  // Sample starter code for different problems
  const starterCode = {
    1: `// Two Sum Problem
// Given an array of integers nums and an integer target, 
// return indices of the two numbers such that they add up to target.

function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    
    return [];
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Should output [0, 1]
console.log(twoSum([3, 2, 4], 6));      // Should output [1, 2]`,
    
    2: `// Valid Parentheses Problem
// Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
// determine if the input string is valid.

function isValid(s) {
    const stack = [];
    const pairs = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    
    for (let char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.length === 0 || stack.pop() !== pairs[char]) {
                return false;
            }
        }
    }
    
    return stack.length === 0;
}

// Test cases
console.log(isValid("()"));     // Should output true
console.log(isValid("([)]"));   // Should output false`,
    
    3: `// Reverse Linked List Problem
// Given the head of a singly linked list, reverse the list, and return the reversed list.

// Definition for singly-linked list node
class ListNode {
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        let nextTemp = current.next;
        current.next = prev;
        prev = current;
        current = nextTemp;
    }
    
    return prev;
}

// Test cases
// Create a sample linked list: 1 -> 2 -> 3 -> 4 -> 5
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const reversed = reverseList(head);
console.log("Reversed list values:");
let current = reversed;
while (current) {
    console.log(current.val);
    current = current.next;
}`
  };

  useEffect(() => {
    setCode(starterCode[currentProblem as keyof typeof starterCode] || starterCode[1]);
    setOutput('');
    setError('');
  }, [currentProblem]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
    
    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'Space Grotesk, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'allDocuments',
    });
  };

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!value) return;
    
    setCode(value);
    
    // Track typing activity with debouncing
    const currentLength = value.length;
    if (Math.abs(currentLength - lastCodeLength.current) > 5) {
      addActivity('typing', `Code modified (${currentLength} characters)`, {
        codeLength: currentLength
      });
      lastCodeLength.current = currentLength;
    }
  }, [addActivity]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    
    addActivity('run', 'Executed code');
    
    try {
      if (language !== 'javascript') {
        const msg = 'Only JavaScript execution is supported in-browser. Switch language to JavaScript to run.';
        setError(msg);
        addActivity('debug', msg);
        setRunResult({ code, language, output: '', error: msg });
        return;
      }
      // Create a safe execution environment with proper error handling
      const safeEval = new Function('console', `
        try {
          ${code}
        } catch (error) {
          console.error('Runtime Error:', error.message);
          console.error('Stack:', error.stack);
        }
      `);
      
      let consoleOutput = '';
      const mockConsole = {
        log: (...args: any[]) => {
          consoleOutput += args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return '[Object]';
              }
            }
            return String(arg);
          }).join(' ') + '\n';
        },
        error: (...args: any[]) => {
          consoleOutput += 'ERROR: ' + args.join(' ') + '\n';
        },
        warn: (...args: any[]) => {
          consoleOutput += 'WARNING: ' + args.join(' ') + '\n';
        }
      };
      
      safeEval(mockConsole);
      
      if (consoleOutput.trim()) {
        setOutput(consoleOutput);
        addActivity('test', 'Code executed successfully');
        setRunResult({ code, language, output: consoleOutput, error: null });
      } else {
        setOutput('Code executed successfully (no output)\n');
        addActivity('test', 'Code executed successfully');
        setRunResult({ code, language, output: 'Code executed successfully (no output)\n', error: null });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      addActivity('debug', `Syntax error: ${errorMessage}`);
      setRunResult({ code, language, output: '', error: errorMessage });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, addActivity, setRunResult]);

  const resetCode = useCallback(() => {
    setCode(starterCode[currentProblem as keyof typeof starterCode] || starterCode[1]);
    setOutput('');
    setError('');
    addActivity('reset', 'Reset code to starter template');
  }, [currentProblem, addActivity]);

  const addPseudocode = useCallback(() => {
    const pseudocode = `// Pseudocode:
// 1. 
// 2. 
// 3. 
// 4. 
// 5. `;
    
    const newCode = pseudocode + '\n\n' + code;
    setCode(newCode);
    addActivity('pseudocode', 'Added pseudocode planning');
  }, [code, addActivity]);

  const addBrainstorm = useCallback(() => {
    const brainstorming = `// Brainstorming:
// - Idea 1
// - Idea 2
// - Edge cases:
//   - 
// Approach:
//   - `;

    const newCode = brainstorming + '\n\n' + code;
    setCode(newCode);
    addActivity('planning', 'Added brainstorming notes');
  }, [code, addActivity]);

  const addTestCases = useCallback(() => {
    const testCases = `// Test Cases:
// Test 1: 
// Test 2: 
// Test 3: 

`;
    
    const newCode = code + '\n\n' + testCases;
    setCode(newCode);
    addActivity('test', 'Added test case structure');
  }, [code, addActivity]);

  const refactorCode = useCallback(() => {
    // Simple refactoring: add comments and improve formatting
    const refactoredCode = code
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('//')) return line;
        if (line.trim().includes('function') || line.trim().includes('class')) {
          return '\n// ' + line.trim() + '\n' + line;
        }
        return line;
      })
      .join('\n');
    
    setCode(refactoredCode);
    addActivity('refactor', 'Refactored code with better structure');
  }, [code, addActivity]);

  const saveCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-${currentProblem}-solution.js`;
    a.click();
    URL.revokeObjectURL(url);
    addActivity('planning', 'Saved code solution');
  }, [code, currentProblem, addActivity]);

  const downloadStarter = useCallback(() => {
    const blob = new Blob([starterCode[currentProblem as keyof typeof starterCode] || starterCode[1]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-${currentProblem}-starter.js`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentProblem]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <motion.h3 
          className="text-lg font-space-grotesk font-bold text-gradient"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Code Editor
        </motion.h3>
        
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field text-sm select-dark"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python (edit only)</option>
            <option value="java">Java (edit only)</option>
            <option value="cpp">C++ (edit only)</option>
          </select>
          
          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="input-field text-sm select-dark"
          >
            <option value="vs-dark">Dark</option>
            <option value="vs-light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-glass-dark">
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runCode}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Play size={16} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetCode}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </motion.button>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addPseudocode}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Code size={16} />
            <span>Add Pseudocode</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addBrainstorm}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Lightbulb size={16} />
            <span>Brainstorm</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addTestCases}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <TestTube size={16} />
            <span>Add Tests</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refactorCode}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Zap size={16} />
            <span>Refactor</span>
          </motion.button>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveCode}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Save size={16} />
            <span>Save</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadStarter}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Download size={16} />
            <span>Download Starter</span>
          </motion.button>
        </div>
      </div>
      
      {/* Editor and Output */}
      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1">
                  <Editor
          height="100%"
          language={language}
          theme={theme}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full text-white/50">Loading editor...</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Space Grotesk, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'allDocuments',
          }}
        />
        </div>
        
        {/* Output Panel */}
        <div className="w-80 bg-glass-dark border-l border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <h4 className="text-sm font-medium text-white">Output</h4>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto">
            {isRunning && (
              <div className="flex items-center space-x-2 text-neon-blue">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-blue"></div>
                <span className="text-sm">Running...</span>
              </div>
            )}
            
            {error && (
              <div className="text-neon-pink text-sm mb-3">
                <div className="font-medium mb-1">Error:</div>
                <pre className="bg-red-900/20 p-2 rounded text-xs">{error}</pre>
              </div>
            )}
        
        {output && (
              <div className="text-white text-sm">
                <div className="font-medium mb-1">Console Output:</div>
                <pre className="bg-glass-white p-2 rounded text-xs font-mono whitespace-pre-wrap">{output}</pre>
              </div>
            )}
            
            {!isRunning && !error && !output && (
              <div className="text-white/50 text-sm text-center py-8">
                Run your code to see output here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;