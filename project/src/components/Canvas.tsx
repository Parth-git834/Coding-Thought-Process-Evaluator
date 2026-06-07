import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Download, 
  Type, 
  Shapes, 
  Palette,
  Trash2
} from 'lucide-react';
import { useActivity } from '../context/ActivityContext';



interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

type Tool = 'pen' | 'eraser' | 'text' | 'shape' | 'select';

const Canvas = () => {
  const { addActivity } = useActivity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [shapeElements, setShapeElements] = useState<ShapeElement[]>([]);
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle' | 'line' | 'arrow'>('rectangle');
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const colors = [
    '#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    contextRef.current = context;

    // Save initial state
    saveToHistory();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [color, strokeWidth]);

  const saveToHistory = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const imageData = contextRef.current.getImageData(
      0, 0, 
      canvasRef.current.width, 
      canvasRef.current.height
    );
    
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const imageData = drawingHistory[historyIndex - 1];
      if (imageData && contextRef.current) {
        contextRef.current.putImageData(imageData, 0, 0);
        addActivity('planning', 'Undid canvas action');
      }
    }
  }, [historyIndex, drawingHistory, addActivity]);

  const redo = useCallback(() => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const imageData = drawingHistory[historyIndex + 1];
      if (imageData && contextRef.current) {
        contextRef.current.putImageData(imageData, 0, 0);
        addActivity('planning', 'Redid canvas action');
      }
    }
  }, [historyIndex, drawingHistory, addActivity]);

    const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text' || tool === 'shape') return;

    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (event.clientX - rect.left) * (canvasRef.current!.width / rect.width / 2);
    const y = (event.clientY - rect.top) * (canvasRef.current!.height / rect.height / 2);
    
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [tool, color, strokeWidth]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || (tool !== 'pen' && tool !== 'eraser')) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (event.clientX - rect.left) * (canvasRef.current!.width / rect.width / 2);
    const y = (event.clientY - rect.top) * (canvasRef.current!.height / rect.height / 2);
    
    if (tool === 'eraser') {
      contextRef.current.globalCompositeOperation = 'destination-out';
      contextRef.current.lineWidth = strokeWidth * 2;
    } else {
      contextRef.current.globalCompositeOperation = 'source-over';
      contextRef.current.lineWidth = strokeWidth;
    }
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  }, [isDrawing, tool, strokeWidth]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    if (contextRef.current) {
      contextRef.current.closePath();
      contextRef.current.globalCompositeOperation = 'source-over';
    }
    
    if (tool === 'pen') {
      addActivity('pseudocode', 'Drew on canvas');
    } else if (tool === 'eraser') {
      addActivity('planning', 'Erased canvas content');
    }
    
    saveToHistory();
  }, [isDrawing, tool, addActivity]);

  const addText = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'text') return;
    
    const { offsetX, offsetY } = event.nativeEvent;
    const text = prompt('Enter text:') || '';
    
    if (text) {
      const newText: TextElement = {
        id: Date.now().toString(),
        x: offsetX,
        y: offsetY,
        text,
        fontSize,
        color
      };
      
      setTextElements(prev => [...prev, newText]);
      addActivity('pseudocode', `Added text: "${text}"`);
      saveToHistory();
    }
  }, [tool, fontSize, color, addActivity]);

  const addShape = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'shape') return;
    
    const { offsetX, offsetY } = event.nativeEvent;
    
    const newShape: ShapeElement = {
      id: Date.now().toString(),
      type: shapeType,
      x: offsetX,
      y: offsetY,
      width: 100,
      height: 100,
      color,
      strokeWidth
    };
    
    setShapeElements(prev => [...prev, newShape]);
    addActivity('pseudocode', `Added ${shapeType} shape`);
    saveToHistory();
  }, [tool, shapeType, color, strokeWidth, addActivity]);

  const clearCanvas = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    
    contextRef.current.clearRect(
      0, 0, 
      canvasRef.current.width, 
      canvasRef.current.height
    );
    
    setTextElements([]);
    setShapeElements([]);
    addActivity('reset', 'Cleared canvas');
    saveToHistory();
  }, [addActivity]);

  const downloadCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'canvas-drawing.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
    addActivity('planning', 'Downloaded canvas');
  }, [addActivity]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      addText(event);
    } else if (tool === 'shape') {
      addShape(event);
    }
  }, [tool, addText, addShape]);

  const renderElements = useCallback(() => {
    if (!contextRef.current) return;
    
    // Render shapes
    shapeElements.forEach(shape => {
      contextRef.current!.strokeStyle = shape.color;
      contextRef.current!.lineWidth = shape.strokeWidth;
      
      if (shape.type === 'rectangle') {
        contextRef.current!.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        contextRef.current!.beginPath();
        contextRef.current!.arc(shape.x + shape.width/2, shape.y + shape.height/2, shape.width/2, 0, 2 * Math.PI);
        contextRef.current!.stroke();
      } else if (shape.type === 'line') {
        contextRef.current!.beginPath();
        contextRef.current!.moveTo(shape.x, shape.y);
        contextRef.current!.lineTo(shape.x + shape.width, shape.y + shape.height);
        contextRef.current!.stroke();
      }
    });
    
    // Render text
    textElements.forEach(textEl => {
      contextRef.current!.font = `${textEl.fontSize}px Space Grotesk`;
      contextRef.current!.fillStyle = textEl.color;
      contextRef.current!.fillText(textEl.text, textEl.x, textEl.y);
    });
  }, [shapeElements, textElements]);

  useEffect(() => {
    renderElements();
  }, [renderElements]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <motion.h3 
          className="text-lg font-space-grotesk font-bold text-gradient"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Canvas & Whiteboard
        </motion.h3>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            disabled={historyIndex <= 0}
            className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50"
          >
            <RotateCcw size={16} />
            <span>Undo</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={redo}
            disabled={historyIndex >= drawingHistory.length - 1}
            className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50"
          >
            <RotateCcw size={16} className="rotate-180" />
            <span>Redo</span>
          </motion.button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-glass-dark">
        {/* Tools */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              tool === 'pen' ? 'bg-neon-purple text-white' : 'bg-glass-white text-white/70 hover:text-white'
            }`}
          >
            <PenTool size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              tool === 'eraser' ? 'bg-neon-purple text-white' : 'bg-glass-white text-white/70 hover:text-white'
            }`}
          >
            <Eraser size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTool('text')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              tool === 'text' ? 'bg-neon-purple text-white' : 'bg-glass-white text-white/70 hover:text-white'
            }`}
          >
            <Type size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTool('shape')}
            className={`p-2 rounded-lg transition-all duration-300 ${
              tool === 'shape' ? 'bg-neon-purple text-white' : 'bg-glass-white text-white/70 hover:text-white'
            }`}
          >
            <Shapes size={18} />
          </motion.button>
        </div>

        {/* Shape Type Selector */}
        {tool === 'shape' && (
          <select
            value={shapeType}
            onChange={(e) => setShapeType(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="line">Line</option>
            <option value="arrow">Arrow</option>
          </select>
        )}

        {/* Color Palette */}
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-white/70" />
          <div className="flex space-x-1">
            {colors.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  color === c ? 'border-white scale-110' : 'border-white/30'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center space-x-2">
          <span className="text-white/70 text-sm">Width:</span>
        <input
          type="range"
          min="1"
          max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-white/70 text-sm w-8">{strokeWidth}</span>
        </div>

        {/* Font Size */}
        {tool === 'text' && (
          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">Size:</span>
            <input
              type="range"
              min="12"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-20"
        />
            <span className="text-white/70 text-sm w-8">{fontSize}</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair bg-glass-dark border border-white/10 rounded-lg"
        />
        
        {/* Canvas Instructions */}
        {textElements.length === 0 && shapeElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/30">
              <Shapes className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Start drawing your pseudocode or diagrams</p>
              <p className="text-sm">Use the tools above to create visual representations</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between p-4 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCanvas}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </motion.button>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadCanvas}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Download size={16} />
            <span>Download</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Canvas;