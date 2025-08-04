import OpenAI from 'openai';
import { Word, Context } from './models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AutocompleteEngine {
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
      const dbSuggestions = await Word.find({
        word: { $regex: '^' + prefix.toLowerCase(), $options: 'i' }
      })
      .sort({ frequency: -1 })
      .limit(3)
      .lean();

      const aiSuggestions = await this.getAISuggestions(this.currentSentence + prefix, false);
      
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

      const aiSuggestions = await this.getAISuggestions(context, true);
      const contextSuggestions = await this.getContextBasedSuggestions(context);
      
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
        await this.saveWord(suggestion, this.currentSentence);
        this.currentSentence += suggestion;
        this.currentWord = '';
      } else {
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

  setSentence(sentence) {
    this.currentSentence = sentence;
    this.currentWord = '';
  }
}

// Global instance for session persistence
let globalEngine = null;

export function getAutocompleteEngine() {
  if (!globalEngine) {
    globalEngine = new AutocompleteEngine();
  }
  return globalEngine;
}
