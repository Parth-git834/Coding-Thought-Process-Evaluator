import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Target, Clock, Zap } from 'lucide-react';
import { useActivity } from '../context/ActivityContext';

const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.",
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "Simple valid parentheses."
      },
      {
        input: 's = "([)]"',
        output: "false",
        explanation: "Brackets are not closed in the correct order."
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: 3,
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "Linked List",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
        explanation: "The linked list is reversed."
      }
    ],
    constraints: [
      "The number of nodes in the list is in the range [0, 5000]",
      "-5000 <= Node.val <= 5000"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  }
];

const ProblemStatement = () => {
  const { currentProblem, setCurrentProblem } = useActivity();
  const [selectedProblem] = useState(problems.find(p => p.id === currentProblem) || problems[0]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-neon-green';
      case 'medium': return 'text-neon-yellow';
      case 'hard': return 'text-neon-pink';
      default: return 'text-white';
    }
  };

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-neon-green/20 border-neon-green/50';
      case 'medium': return 'bg-neon-yellow/20 border-neon-yellow/50';
      case 'hard': return 'bg-neon-pink/20 border-neon-pink/50';
      default: return 'bg-white/20 border-white/50';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-xl font-space-grotesk font-bold text-gradient"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Problem Statement
          </motion.h2>
          
          {/* Problem Selector */}
          <div className="flex space-x-2">
            {problems.map((problem) => (
              <motion.button
                key={problem.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentProblem(problem.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentProblem === problem.id
                    ? 'bg-neon-purple text-white shadow-neon'
                    : 'bg-glass-white text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                {problem.id}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Problem Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Title and Difficulty */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-space-grotesk font-bold text-white">
              {selectedProblem.title}
            </h3>
            <div className={`px-3 py-1.5 rounded-lg border ${getDifficultyBg(selectedProblem.difficulty)}`}>
              <span className={`text-sm font-medium ${getDifficultyColor(selectedProblem.difficulty)}`}>
                {selectedProblem.difficulty}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-neon-blue" />
            <span className="text-white/70 text-sm">{selectedProblem.category}</span>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-neon-purple" />
              <span>Description</span>
            </h4>
            <p className="text-white/80 leading-relaxed">
              {selectedProblem.description}
            </p>
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-neon-green" />
              <span>Examples</span>
            </h4>
            <div className="space-y-3">
              {selectedProblem.examples.map((example, index) => (
                <div key={index} className="bg-glass-dark rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-neon-blue font-medium">Input:</span>
                    <code className="ml-2 text-white/90 font-mono text-sm">
                      {example.input}
                    </code>
                  </div>
                  <div>
                    <span className="text-neon-green font-medium">Output:</span>
                    <code className="ml-2 text-white/90 font-mono text-sm">
                      {example.output}
                    </code>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="text-neon-purple font-medium">Explanation:</span>
                      <span className="ml-2 text-white/70 text-sm">
                        {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-neon-yellow" />
              <span>Constraints</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
              {selectedProblem.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          </div>

          {/* Complexity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-glass-dark rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-neon-blue" />
                <span className="text-white font-medium">Time Complexity</span>
              </div>
              <code className="text-neon-blue font-mono text-sm">
                {selectedProblem.timeComplexity}
              </code>
            </div>
            <div className="bg-glass-dark rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-neon-green" />
                <span className="text-white font-medium">Space Complexity</span>
              </div>
              <code className="text-neon-green font-mono text-sm">
                {selectedProblem.spaceComplexity}
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProblemStatement;