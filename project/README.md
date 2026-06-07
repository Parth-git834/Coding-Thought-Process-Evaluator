# 🚀 Coding Thought Process Analyzer

A comprehensive full-stack web application that tracks, monitors, and analyzes how students solve coding problems step by step. The app generates visual "Thought Process Reports" showing strengths and areas for improvement.

## 📸 Application Demo

![App Interface Walkthrough](docs/images/generate_ml_report.webp)

## ✨ Features

### 🎯 Machine Learning & Cognitive Analysis
- **Scikit-learn Decision Tree Classifier**: Trains on-the-fly to classify students' problem-solving approach (`systematic`, `trial_and_error`, `mixed`) based on their coding vs planning patterns.
- **Cognitive Regression Models**: Uses Scikit-learn Decision Tree Regressors to predict the student's continuous Focus Level, overall coding Efficiency, and average Typing Speed (WPM).
- **Real-time Activity Tracking**: Monitor typing, pseudocode, testing, debugging, and refactoring activities.
- **Methodology Validation**: Verifies planning (pseudocode-first) and testing (test-first) timelines to rate methodology scores.
- **Pattern Recognition**: Deep analysis of student cognitive states and structured recommendations.

### 🎨 Modern UI/UX
- **Deep-night Theme**: Beautiful gradient backgrounds with glass panels
- **Responsive Layout**: Drag-and-drop panels using react-grid-layout
- **Smooth Animations**: Framer Motion animations throughout the interface
- **Real-time Updates**: Live activity timeline and insights via WebSocket

### 📊 Comprehensive Reporting
- **Thought Process Report**: Detailed analysis with strengths and improvements
- **Activity Timeline**: Visual representation of all coding activities
- **Real-time Insights**: Live feedback and recommendations
- **Export Functionality**: Download reports in JSON format

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom deep-night theme
- **Framer Motion** for animations
- **Monaco Editor** for code editing
- **Recharts** for data visualization
- **React Grid Layout** for draggable panels
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **Socket.io** for real-time WebSocket communication
- **MongoDB** with Mongoose for data persistence
- **RESTful APIs** for CRUD operations
- **Real-time Analysis** engine

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd coding-thought-process-analyzer

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the `server` directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/coding-analyzer

# Client Configuration
CLIENT_URL=http://localhost:5173
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend
npm run dev

# Or run both simultaneously
npm run dev:full
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
coding-thought-process-analyzer/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ProblemStatement.tsx # Problem display and selection
│   │   ├── CodeEditor.tsx       # Monaco editor with activity tracking
│   │   ├── Canvas.tsx           # Interactive whiteboard
│   │   ├── ActivityTimeline.tsx # Real-time activity timeline
│   │   ├── ThoughtProcessReport.tsx # Analysis and insights
│   │   └── RealTimeInsights.tsx # Live metrics and feedback
│   ├── context/                  # React context providers
│   │   ├── SocketContext.tsx    # WebSocket connection management
│   │   └── ActivityContext.tsx  # Activity state management
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # Application entry point
├── server/                       # Backend source code
│   ├── models/                   # MongoDB schemas
│   │   ├── Activity.js          # Student activity model
│   │   ├── Session.js           # Coding session model
│   │   └── Analysis.js          # Analysis results model
│   ├── routes/                   # API endpoints
│   │   ├── activities.js        # Activity CRUD operations
│   │   ├── sessions.js          # Session management
│   │   └── analysis.js          # Analysis generation
│   └── server.js                # Express server with Socket.io
├── package.json                  # Frontend dependencies
├── server/package.json           # Backend dependencies
└── README.md                     # This file
```

## 🔧 Configuration

### Frontend Customization

#### Tailwind Theme
The deep-night theme is configured in `tailwind.config.js`:

```javascript
colors: {
  'deep-night': {
    50: '#0a0a0f',
    100: '#0f0f1a',
    // ... more shades
  },
  'neon': {
    blue: '#00d4ff',
    purple: '#a855f7',
    // ... more colors
  }
}
```

#### Component Layout
Modify the default layout in `src/App.tsx`:

```javascript
const defaultLayout = {
  lg: [
    { i: 'problem', x: 0, y: 0, w: 6, h: 3 },
    { i: 'editor', x: 6, y: 0, w: 6, h: 6 },
    // ... more panels
  ]
};
```

### Backend Configuration

#### MongoDB Connection
Update the connection string in `server/.env`:

```bash
# Local development
MONGODB_URI=mongodb://localhost:27017/coding-analyzer

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coding-analyzer
```

#### API Endpoints
The server provides these main endpoints:

- `GET /api/activities` - List activities with filtering
- `POST /api/activities` - Create new activity
- `GET /api/sessions` - List coding sessions
- `POST /api/sessions` - Create new session
- `GET /api/analysis` - Get analysis results
- `POST /api/analysis/generate/:sessionId` - Generate analysis

## 📊 Usage Guide

### 1. Start a Coding Session
- Select a problem from the Problem Statement panel
- The system automatically starts tracking your activities
- Use the Code Editor to write your solution

### 2. Track Your Process
- **Planning**: Use the Canvas to draw diagrams or write pseudocode
- **Coding**: Write code in the Monaco Editor
- **Testing**: Run your code and see output
- **Debugging**: Fix errors and improve your solution

### 3. View Real-time Insights
- **Activity Timeline**: See all your activities in chronological order
- **Real-time Insights**: Get live feedback and recommendations
- **Thought Process Report**: Comprehensive analysis of your methodology

### 4. Analyze Your Performance
- **Methodology Score**: Based on planning, testing, and refactoring practices
- **Efficiency Metrics**: Coding vs debugging time analysis
- **Strengths & Improvements**: Personalized feedback for growth

## 🔌 API Reference

### WebSocket Events

#### Client to Server
- `activity` - Send new activity data
- `session_start` - Start new coding session
- `session_end` - End current session

#### Server to Client
- `activity_update` - New activity from other clients
- `analysis_update` - Updated analysis results
- `session_created` - Session creation confirmation
- `session_ended` - Session end confirmation

### REST API Endpoints

#### Activities
```bash
GET    /api/activities                    # List activities
GET    /api/activities/:id               # Get specific activity
POST   /api/activities                   # Create activity
PUT    /api/activities/:id               # Update activity
DELETE /api/activities/:id               # Delete activity
GET    /api/activities/session/:sessionId # Get session activities
GET    /api/activities/stats/:sessionId  # Get activity statistics
```

#### Sessions
```bash
GET    /api/sessions                     # List sessions
GET    /api/sessions/:id                 # Get specific session
POST   /api/sessions                     # Create session
PUT    /api/sessions/:id                 # Update session
PUT    /api/sessions/:id/end            # End session
PUT    /api/sessions/:id/pause          # Pause session
PUT    /api/sessions/:id/resume         # Resume session
DELETE /api/sessions/:id                 # Delete session
```

#### Analysis
```bash
GET    /api/analysis                     # List analyses
GET    /api/analysis/:id                 # Get specific analysis
POST   /api/analysis                     # Create analysis
PUT    /api/analysis/:id                 # Update analysis
DELETE /api/analysis/:id                 # Delete analysis
POST   /api/analysis/generate/:sessionId # Generate analysis
```

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
cd server
npm test
```

### API Testing
Use tools like Postman or curl to test the REST endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test activities endpoint
curl http://localhost:5000/api/activities
```

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or any static hosting
```

### Backend Deployment
```bash
# Set production environment
NODE_ENV=production
PORT=5000

# Start production server
npm start
```

### Docker Deployment
```bash
# Build and run with Docker
docker build -t coding-analyzer .
docker run -p 5000:5000 coding-analyzer
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** for the excellent code editing experience
- **Framer Motion** for smooth animations
- **Tailwind CSS** for the utility-first CSS framework
- **Socket.io** for real-time communication
- **MongoDB** for flexible data storage

## 📞 Support

If you have any questions or need help:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API reference above

---

**Happy Coding! 🎉**

*This application helps students develop better problem-solving methodologies by providing real-time feedback and comprehensive analysis of their coding process.*
