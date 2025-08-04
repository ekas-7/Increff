# AI-Enhanced Autocomplete System - Phase 2

A sophisticated autocomplete system that combines traditional word completion with AI-powered suggestions and voice input capabilities.

## Features

### 🎯 Core Functionality
- **Intelligent Word Completion**: Real-time suggestions as you type
- **Next Word Prediction**: AI-powered suggestions for the next word after completing a word
- **Context-Aware Suggestions**: Uses sentence context to provide relevant suggestions
- **Persistent Learning**: Stores word patterns and frequency in MongoDB

### 🎹 Virtual Keyboard
- **Full QWERTY Layout**: Complete on-screen keyboard with all letters and symbols
- **Shift & Caps Lock Support**: Proper capitalization and special character input
- **Visual Feedback**: Active key highlighting and status indicators
- **Responsive Design**: Works on both desktop and mobile devices

### 🎤 Voice Input
- **Speech-to-Text**: Convert voice input to text using OpenAI Whisper
- **High-Quality Audio Processing**: Optimized audio capture and processing
- **Real-time Feedback**: Visual indicators for recording status
- **Browser Compatibility**: Works across modern browsers

### 🤖 AI Integration
- **OpenAI GPT Integration**: Contextual word and sentence completion
- **MongoDB Storage**: Persistent word frequency and context storage
- **Hybrid Suggestions**: Combines AI predictions with learned patterns
- **Adaptive Learning**: Improves suggestions based on usage patterns

## Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB + Mongoose**: Data persistence and word storage
- **OpenAI API**: GPT-3.5 for intelligent suggestions and Whisper for speech recognition
- **Multer**: Audio file handling for voice input

### Frontend
- **Next.js 15**: React-based frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **Modern React Hooks**: State management and effects
- **Responsive Design**: Mobile-first approach

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/autocomplete_db
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### 3. MongoDB Setup
- Install MongoDB locally or use MongoDB Atlas
- The application will automatically create the required collections
- Default database name: `autocomplete_db`

### 4. OpenAI API Setup
- Sign up at [OpenAI](https://platform.openai.com/)
- Generate an API key
- Add the key to your `.env` file
- Ensure you have credits available for API usage

### 5. Start the Application

```bash
npm run dev
```

The application will run on `http://localhost:3000` with both frontend and backend API routes.
```
The frontend will run on `http://localhost:3000`

### 6. Verify Setup
- Open `http://localhost:3000` in your browser
- Check that the virtual keyboard works
- Test voice input (allow microphone permissions)
- Verify suggestions appear as you type

## API Endpoints

### Character Input
- **POST** `/api/add-character`
  - Body: `{ "character": "a" }`
  - Returns: Current text, suggestions, and word completion status

### Character Removal
- **POST** `/api/remove-character`
  - Returns: Updated text and suggestions after character removal

### Suggestion Selection
- **POST** `/api/process-suggestion`
  - Body: `{ "suggestion": "example" }`
  - Returns: Updated text after suggestion selection

### Voice Transcription
- **POST** `/api/transcribe-audio`
  - Body: FormData with audio file
  - Returns: Transcribed text and updated suggestions

### Health Check
- **GET** `/api/health`
  - Returns: Server status

## Usage Guide

### Text Input
1. Use the virtual keyboard to type characters
2. Watch suggestions appear in real-time
3. Click on suggestions to auto-complete words
4. Continue typing to get next-word suggestions

### Voice Input
1. Click the microphone button
2. Speak clearly at normal pace
3. Click again to stop recording
4. Wait for transcription and suggestions

### Keyboard Features
- **Shift**: Hold for single uppercase letter
- **Caps Lock**: Toggle for continuous uppercase
- **Special Characters**: Use Shift + number keys
- **Backspace**: Remove characters

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **OpenAI API**: Check API key validity and credit balance
3. **Microphone Access**: Grant browser permissions for voice input
4. **CORS Issues**: Backend includes CORS middleware for development

## License

This project is licensed under the MIT License.
