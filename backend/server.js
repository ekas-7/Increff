const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for audio file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocomplete_db');

// Word Schema for MongoDB
const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  frequency: { type: Number, default: 1 },
  contexts: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Word = mongoose.model('Word', wordSchema);

// Context Schema for storing sentence contexts
const contextSchema = new mongoose.Schema({
  sentence: { type: String, required: true },
  words: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Context = mongoose.model('Context', contextSchema);

// Autocomplete Engine Class
class AutocompleteEngine {
  constructor() {
    this.currentSentence = '';
    this.currentWord = '';
  }

  async addCharacter(char) {
    if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?') {
      if (this.currentWord.trim()) {
        await this.saveWord(this.currentWord.trim(), this.currentSentence);
        this.currentSentence += this.currentWord + char;
        this.currentWord = '';
      } else {
        this.currentSentence += char;
      }
    } else {
      this.currentWord += char;
    }
  }

  async removeCharacter() {
    if (this.currentWord.length > 0) {
      this.currentWord = this.currentWord.slice(0, -1);
    } else if (this.currentSentence.length > 0) {
      const lastChar = this.currentSentence.slice(-1);
      this.currentSentence = this.currentSentence.slice(0, -1);
      
      // If we removed a space or punctuation, move the last word back to currentWord
      if ([' ', '.', ',', '!', '?'].includes(lastChar)) {
        const words = this.currentSentence.trim().split(/\s+/);
        if (words.length > 0 && words[words.length - 1]) {
          this.currentWord = words[words.length - 1];
          this.currentSentence = this.currentSentence.replace(new RegExp(this.currentWord + '$'), '');
        }
      }
    }
  }

  async saveWord(word, context) {
    try {
      const existingWord = await Word.findOne({ word: word.toLowerCase() });
      if (existingWord) {
        existingWord.frequency += 1;
        if (!existingWord.contexts.includes(context)) {
          existingWord.contexts.push(context);
        }
        await existingWord.save();
      } else {
        await Word.create({
          word: word.toLowerCase(),
          frequency: 1,
          contexts: [context]
        });
      }
    } catch (error) {
      console.error('Error saving word:', error);
    }
  }

  async getCompletionSuggestions(prefix) {
    if (!prefix.trim()) return [];
    
    try {
      // Get suggestions from MongoDB
      const dbSuggestions = await Word.find({
        word: { $regex: '^' + prefix.toLowerCase(), $options: 'i' }
      })
      .sort({ frequency: -1 })
      .limit(3)
      .lean();

      // Get AI-enhanced suggestions
      const aiSuggestions = await this.getAISuggestions(this.currentSentence + prefix, false);
      
      // Combine and deduplicate suggestions
      const allSuggestions = [
        ...dbSuggestions.map(w => w.word),
        ...aiSuggestions
      ];
      
      return [...new Set(allSuggestions)].slice(0, 5);
    } catch (error) {
      console.error('Error getting completion suggestions:', error);
      return [];
    }
  }

  async getNextWordSuggestions() {
    try {
      const context = this.currentSentence.trim();
      if (!context) return [];

      // Get AI suggestions for next word
      const aiSuggestions = await this.getAISuggestions(context, true);
      
      // Get context-based suggestions from MongoDB
      const contextSuggestions = await this.getContextBasedSuggestions(context);
      
      // Combine suggestions
      const allSuggestions = [...aiSuggestions, ...contextSuggestions];
      return [...new Set(allSuggestions)].slice(0, 5);
    } catch (error) {
      console.error('Error getting next word suggestions:', error);
      return [];
    }
  }

  async getAISuggestions(context, isNextWord = false) {
    try {
      const prompt = isNextWord 
        ? `Given the context: "${context}", suggest 3 most probable next words that would naturally follow. Return only the words separated by commas, no explanations.`
        : `Given the incomplete text: "${context}", suggest 3 most probable word completions for the last word. Return only the complete words separated by commas, no explanations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.7,
      });

      const suggestions = response.choices[0].message.content
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);

      return suggestions;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  async getContextBasedSuggestions(context) {
    try {
      const words = context.split(/\s+/);
      const lastTwoWords = words.slice(-2).join(' ');
      
      const contexts = await Context.find({
        sentence: { $regex: lastTwoWords, $options: 'i' }
      }).limit(10);

      const nextWords = [];
      contexts.forEach(ctx => {
        const ctxWords = ctx.sentence.split(/\s+/);
        for (let i = 0; i < ctxWords.length - 1; i++) {
          if (ctxWords.slice(i, i + 2).join(' ').toLowerCase() === lastTwoWords.toLowerCase()) {
            if (ctxWords[i + 2]) {
              nextWords.push(ctxWords[i + 2].toLowerCase());
            }
          }
        }
      });

      return [...new Set(nextWords)].slice(0, 3);
    } catch (error) {
      console.error('Error getting context-based suggestions:', error);
      return [];
    }
  }

  getCurrentText() {
    return this.currentSentence + this.currentWord;
  }

  async processSuggestionSelection(suggestion) {
    try {
      if (this.currentWord) {
        // Word completion
        await this.saveWord(suggestion, this.currentSentence);
        this.currentSentence += suggestion;
        this.currentWord = '';
      } else {
        // Next word suggestion
        await this.saveWord(suggestion, this.currentSentence);
        this.currentSentence += suggestion;
      }
      
      return {
        success: true,
        currentText: this.getCurrentText()
      };
    } catch (error) {
      console.error('Error processing suggestion selection:', error);
      return { success: false, error: error.message };
    }
  }

  async transcribeAudio(audioBuffer) {
    try {
      // Create a temporary file-like object for OpenAI
      const audioFile = {
        buffer: audioBuffer,
        name: 'audio.wav',
        type: 'audio/wav'
      };

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text'
      });

      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  setSentence(sentence) {
    this.currentSentence = sentence;
    this.currentWord = '';
  }
}

// Create autocomplete engine instance
const autocompleteEngine = new AutocompleteEngine();

// Validation middleware
const validateCharacter = (req, res, next) => {
  const { character } = req.body;
  if (typeof character !== 'string' || character.length !== 1) {
    return res.status(400).json({ 
      error: 'Character must be a single string character' 
    });
  }
  next();
};

const validateSuggestion = (req, res, next) => {
  const { suggestion } = req.body;
  if (typeof suggestion !== 'string' || suggestion.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Suggestion must be a non-empty string' 
    });
  }
  next();
};

// Routes
app.post('/api/add-character', validateCharacter, async (req, res) => {
  try {
    const { character } = req.body;
    await autocompleteEngine.addCharacter(character);
    
    let suggestions = [];
    if (autocompleteEngine.currentWord) {
      suggestions = await autocompleteEngine.getCompletionSuggestions(autocompleteEngine.currentWord);
    } else {
      suggestions = await autocompleteEngine.getNextWordSuggestions();
    }
    
    res.json({
      currentText: autocompleteEngine.getCurrentText(),
      suggestions,
      isWordComplete: !autocompleteEngine.currentWord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/remove-character', async (req, res) => {
  try {
    await autocompleteEngine.removeCharacter();
    
    let suggestions = [];
    if (autocompleteEngine.currentWord) {
      suggestions = await autocompleteEngine.getCompletionSuggestions(autocompleteEngine.currentWord);
    } else {
      suggestions = await autocompleteEngine.getNextWordSuggestions();
    }
    
    res.json({
      currentText: autocompleteEngine.getCurrentText(),
      suggestions,
      isWordComplete: !autocompleteEngine.currentWord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process-suggestion', validateSuggestion, async (req, res) => {
  try {
    const { suggestion } = req.body;
    const result = await autocompleteEngine.processSuggestionSelection(suggestion);
    
    let newSuggestions = [];
    if (autocompleteEngine.currentWord) {
      newSuggestions = await autocompleteEngine.getCompletionSuggestions(autocompleteEngine.currentWord);
    } else {
      newSuggestions = await autocompleteEngine.getNextWordSuggestions();
    }
    
    res.json({
      ...result,
      suggestions: newSuggestions,
      isWordComplete: !autocompleteEngine.currentWord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcribe-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcription = await autocompleteEngine.transcribeAudio(req.file.buffer);
    autocompleteEngine.setSentence(transcription);
    
    // Save the transcribed sentence context
    await Context.create({
      sentence: transcription,
      words: transcription.split(/\s+/)
    });
    
    res.json({
      transcription,
      currentText: autocompleteEngine.getCurrentText(),
      suggestions: await autocompleteEngine.getNextWordSuggestions()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/current-text', (req, res) => {
  res.json({
    currentText: autocompleteEngine.getCurrentText(),
    isWordComplete: !autocompleteEngine.currentWord
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});

module.exports = app;
