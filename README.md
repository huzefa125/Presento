# Presento - Interactive Presentation Platform

![Presento](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

Presento is a real-time interactive presentation platform similar to Mentimeter, built with React, Node.js, Socket.IO, and MongoDB. It enables presenters to create engaging presentations with various interactive slide types and collect real-time audience responses.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Interaction Types](#interaction-types)
- [API Documentation](#api-documentation)
- [Socket Events](#socket-events)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **Real-time Interactions**: Live updates using Socket.IO for instant feedback
- **Multiple Interaction Types**: 12+ different slide types for diverse engagement
- **User Authentication**: Secure authentication using Firebase Auth with JWT
- **Presentation Management**: Create, edit, delete, and organize presentations
- **Live Presentation Mode**: Present slides with real-time participant tracking
- **Participant Join**: Easy access via 6-digit codes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Visualization**: Beautiful charts and graphs for response analytics

### Interaction Types
1. **Multiple Choice** - Traditional poll with multiple options
2. **Word Cloud** - Visual representation of text responses
3. **Open-Ended** - Free text responses with optional voting
4. **Scales** - Rating scales with customizable ranges
5. **Ranking** - Drag-and-drop item ranking
6. **Q&A** - Live question and answer sessions
7. **Guess Number** - Number guessing game with distribution
8. **100 Points** - Allocate points across options
9. **2x2 Grid** - Position items on a two-axis grid
10. **Pin on Image** - Click locations on an image
11. **Quiz** - Timed quiz with scoring and leaderboards
12. **Leaderboard** - Display quiz results and rankings

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router 7.9.3** - Client-side routing
- **Socket.IO Client 4.8.1** - Real-time communication
- **Axios 1.12.2** - HTTP client
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **Framer Motion 12.23.22** - Animation library
- **Chart.js 4.5.0** - Data visualization
- **D3.js 7.9.0** - Advanced visualizations
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **@dnd-kit** - Drag and drop functionality

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **Socket.IO 4.8.1** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose 8.18.3** - MongoDB ODM
- **Firebase Admin 13.5.0** - Firebase authentication
- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
- **Bcrypt.js 3.0.2** - Password hashing
- **Cloudinary 2.7.0** - Image upload and management
- **CORS 2.8.5** - Cross-origin resource sharing

## 📁 Project Structure

```
Presento/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection
│   │   │   └── firebase.js          # Firebase Admin initialization
│   │   ├── controllers/
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── presentationController.js  # Presentation CRUD
│   │   │   └── uploadController.js  # Image upload handling
│   │   ├── interactions/
│   │   │   ├── index.js             # Interaction registry
│   │   │   ├── multipleChoice.js    # MCQ handler
│   │   │   ├── wordCloud.js         # Word cloud handler
│   │   │   ├── openEnded.js         # Open-ended handler
│   │   │   ├── scales.js            # Scales handler
│   │   │   ├── ranking.js           # Ranking handler
│   │   │   ├── qna.js               # Q&A handler
│   │   │   ├── guessNumber.js       # Guess number handler
│   │   │   ├── hundredPoints.js     # 100 points handler
│   │   │   ├── twoByTwoGrid.js      # 2x2 grid handler
│   │   │   ├── pinOnImage.js        # Pin on image handler
│   │   │   └── quiz.js              # Quiz handler
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── Presentation.js      # Presentation schema
│   │   │   ├── Slide.js             # Slide schema
│   │   │   ├── Response.js          # Response schema
│   │   │   ├── ParticipantScore.js  # Quiz score schema
│   │   │   └── Image.js             # Image metadata schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Auth endpoints
│   │   │   ├── presentationRoutes.js # Presentation endpoints
│   │   │   └── uploadRoutes.js      # Upload endpoints
│   │   ├── services/
│   │   │   ├── cloudinaryService.js # Cloudinary integration
│   │   │   ├── qnaSession.js        # Q&A session management
│   │   │   ├── guessNumberSession.js # Guess number session
│   │   │   ├── quizSessionService.js # Quiz session management
│   │   │   ├── quizScoringService.js # Quiz scoring logic
│   │   │   └── leaderboardService.js # Leaderboard generation
│   │   ├── socket/
│   │   │   ├── socketHandlers.js    # Main socket event handlers
│   │   │   ├── quizHandlers.js      # Quiz-specific handlers
│   │   │   └── openEnded.js         # Open-ended handlers
│   │   └── server.js                # Express server setup
│   ├── .env                         # Environment variables (not in git)
│   ├── .env-example                 # Environment template
│   ├── firebase.json                # Firebase service account
│   └── package.json                 # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Reusable components
│   │   │   ├── interactions/        # Interaction-specific components
│   │   │   │   ├── mcq/
│   │   │   │   ├── wordCloud/
│   │   │   │   ├── openEnded/
│   │   │   │   ├── scales/
│   │   │   │   ├── ranking/
│   │   │   │   ├── qna/
│   │   │   │   ├── guessNumber/
│   │   │   │   ├── hundredPoints/
│   │   │   │   ├── twoByTwoGrid/
│   │   │   │   ├── pinOnImage/
│   │   │   │   ├── quiz/
│   │   │   │   └── leaderboard/
│   │   │   ├── pages/
│   │   │   │   ├── Landing.jsx      # Landing page
│   │   │   │   ├── Presentation.jsx # Presentation editor
│   │   │   │   ├── PresentMode.jsx  # Live presentation view
│   │   │   │   └── JoinPresentation.jsx # Participant view
│   │   │   ├── presentation/        # Presentation components
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Login.jsx            # Login page
│   │   │   └── Register.jsx         # Registration page
│   │   ├── config/
│   │   │   ├── api.js               # Axios configuration
│   │   │   └── firebase.js          # Firebase client config
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── services/
│   │   │   └── presentationService.js # API service layer
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # App entry point
│   │   └── index.css                # Global styles
│   ├── .env                         # Frontend environment variables
│   ├── .env-example                 # Frontend env template
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration
│   └── package.json                 # Frontend dependencies
│
└── README.md                        # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **MongoDB** (v6.0 or higher) - Local or Atlas
- **Firebase Account** - For authentication
- **Cloudinary Account** (Optional) - For image uploads

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ridham1906/inavora.git
cd inavora
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Create `.env` file** in the `backend` directory:

```bash
cd backend
cp .env-example .env
```

2. **Configure environment variables** in `backend/.env`:

```env
# Server Configuration
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/inavora
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inavora

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

3. **Firebase Service Account Setup**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase.json` in the `backend` directory

### Frontend Configuration

1. **Create `.env` file** in the `frontend` directory:

```bash
cd frontend
cp .env-example .env
```

2. **Configure environment variables** in `frontend/.env`:

```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL
VITE_API_URL=http://localhost:4000
```

3. **Firebase Client Setup**:
   - Go to Firebase Console > Project Settings > General
   - Scroll to "Your apps" section
   - Click "Web" icon to add a web app
   - Copy the configuration values to your `.env` file

## 🏃 Running the Application

### Development Mode

#### 1. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- Ensure your connection string is correctly configured in `backend/.env`

#### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:4000`

#### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## 🎯 Interaction Types

### 1. Multiple Choice
- **Description**: Traditional poll with multiple options
- **Use Cases**: Surveys, voting, quick polls
- **Features**: Real-time vote counting, percentage display

### 2. Word Cloud
- **Description**: Visual representation of text responses
- **Use Cases**: Brainstorming, feedback collection
- **Features**: Dynamic sizing based on frequency, multiple submissions per participant

### 3. Open-Ended
- **Description**: Free text responses with optional voting
- **Use Cases**: Ideas, suggestions, feedback
- **Features**: Voting system, response moderation

### 4. Scales
- **Description**: Rating scales with customizable ranges
- **Use Cases**: Satisfaction surveys, ratings
- **Features**: Multiple statements, average calculation, distribution charts

### 5. Ranking
- **Description**: Drag-and-drop item ranking
- **Use Cases**: Prioritization, preference ordering
- **Features**: Average rank calculation, visual ranking display

### 6. Q&A
- **Description**: Live question and answer sessions
- **Use Cases**: Town halls, AMAs, lectures
- **Features**: Question moderation, mark as answered, active question highlighting

### 7. Guess Number
- **Description**: Number guessing game with distribution
- **Use Cases**: Estimation games, icebreakers
- **Features**: Configurable range, distribution visualization, correct answer reveal

### 8. 100 Points
- **Description**: Allocate 100 points across options
- **Use Cases**: Budget allocation, priority distribution
- **Features**: Point validation, average allocation display

### 9. 2x2 Grid
- **Description**: Position items on a two-axis grid
- **Use Cases**: Prioritization matrices, positioning
- **Features**: Customizable axes, scatter plot visualization

### 10. Pin on Image
- **Description**: Click locations on an image
- **Use Cases**: Location identification, hotspot analysis
- **Features**: Image upload, pin clustering, correct area definition

### 11. Quiz
- **Description**: Timed quiz with scoring
- **Use Cases**: Knowledge testing, training
- **Features**: Time limits, points system, instant feedback, leaderboards

### 12. Leaderboard
- **Description**: Display quiz results and rankings
- **Use Cases**: Competition tracking, gamification
- **Features**: Auto-generated after quiz slides, cumulative scoring

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/firebase`
Exchange Firebase token for JWT
```json
Request:
{
  "firebaseToken": "string"
}

Response:
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string"
  }
}
```

#### GET `/api/auth/me`
Get current user (requires JWT)
```json
Response:
{
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string"
  }
}
```

### Presentation Endpoints

#### POST `/api/presentations`
Create a new presentation
```json
Request:
{
  "title": "string"
}

Response:
{
  "message": "Presentation created successfully",
  "presentation": {
    "id": "string",
    "title": "string",
    "accessCode": "string",
    "isLive": false,
    "currentSlideIndex": 0
  }
}
```

#### GET `/api/presentations`
Get all user presentations

#### GET `/api/presentations/:id`
Get presentation by ID with slides

#### PUT `/api/presentations/:id`
Update presentation

#### DELETE `/api/presentations/:id`
Delete presentation and all related data

### Slide Endpoints

#### POST `/api/presentations/:presentationId/slides`
Create a new slide

#### PUT `/api/presentations/:presentationId/slides/:slideId`
Update a slide

#### DELETE `/api/presentations/:presentationId/slides/:slideId`
Delete a slide

### Upload Endpoints

#### POST `/api/upload/image`
Upload image to Cloudinary

## 🔌 Socket Events

### Client to Server Events

#### `start-presentation`
Start a presentation
```javascript
socket.emit('start-presentation', {
  presentationId: 'string',
  userId: 'string',
  startIndex: number
});
```

#### `join-presentation`
Participant joins presentation
```javascript
socket.emit('join-presentation', {
  accessCode: 'string',
  participantId: 'string'
});
```

#### `submit-response`
Submit a response
```javascript
socket.emit('submit-response', {
  presentationId: 'string',
  slideId: 'string',
  participantId: 'string',
  participantName: 'string',
  answer: any
});
```

#### `change-slide`
Change to a different slide
```javascript
socket.emit('change-slide', {
  presentationId: 'string',
  slideIndex: number
});
```

#### `end-presentation`
End the presentation
```javascript
socket.emit('end-presentation', {
  presentationId: 'string'
});
```

### Server to Client Events

#### `presentation-started`
Presentation has started

#### `joined-presentation`
Successfully joined presentation

#### `response-updated`
New response received

#### `slide-changed`
Slide has changed

#### `participant-joined`
New participant joined

#### `presentation-ended`
Presentation has ended

#### `error`
Error occurred

## 🗄️ Database Schema

### User Schema
```javascript
{
  firebaseUid: String (unique, required),
  email: String (unique, required),
  displayName: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Presentation Schema
```javascript
{
  userId: ObjectId (ref: User),
  title: String (required),
  isLive: Boolean (default: false),
  currentSlideIndex: Number (default: 0),
  accessCode: String (unique, 6 digits),
  showResults: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Slide Schema
```javascript
{
  presentationId: ObjectId (ref: Presentation),
  order: Number (required),
  type: String (enum: interaction types),
  question: String (required),
  // Type-specific fields...
  createdAt: Date,
  updatedAt: Date
}
```

### Response Schema
```javascript
{
  presentationId: ObjectId (ref: Presentation),
  slideId: ObjectId (ref: Slide),
  participantId: String (required),
  participantName: String,
  answer: Mixed (required),
  submissionCount: Number,
  votes: Number,
  isCorrect: Boolean,
  responseTime: Number,
  points: Number,
  submittedAt: Date
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**@Ridham**

## 🙏 Acknowledgments

- Inspired by Mentimeter
- Built with modern web technologies
- Community contributions and feedback

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Happy Presenting! 🎉**
