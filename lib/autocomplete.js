import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AutocompleteEngine {
  constructor() {
    this.currentSentence = '';
    this.currentWord = '';
  }

  async addCharacter(char) {
    if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?' || char === '\n') {
      if (this.currentWord.trim()) {
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
      
      if ([' ', '.', ',', '!', '?', '\n'].includes(lastChar)) {
        const words = this.currentSentence.trim().split(/\s+/);
        if (words.length > 0 && words[words.length - 1]) {
          this.currentWord = words[words.length - 1];
          this.currentSentence = this.currentSentence.replace(new RegExp(this.currentWord + '$'), '');
        }
      }
    }
  }

  async getCompletionSuggestions(prefix) {
    if (!prefix.trim()) return [];
    
    try {
      const fullContext = this.currentSentence + prefix;
      const prompt = `Complete the word that starts with "${prefix}" in this context: "${fullContext}". 
      Provide 5 most likely word completions that start with "${prefix}".
      Return only the complete words separated by commas, no explanations.
      Example: if prefix is "hel" you might return: hello, help, helicopter, helmet, hello`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      });

      const suggestions = response.choices[0].message.content
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0 && s.startsWith(prefix.toLowerCase()) && /^[a-zA-Z]+$/.test(s))
        .slice(0, 5);

      return suggestions;
    } catch (error) {
      console.error('Error getting completion suggestions:', error);
      // Fallback to simple prefix matching with common words
      return this.getFallbackCompletions(prefix);
    }
  }

  async getNextWordSuggestions() {
    const context = this.currentSentence.trim();
    if (!context) return this.getStarterWords();

    try {
      const prompt = `Given this text: "${context}", suggest 5 most probable next words that would naturally continue this sentence.
      Consider the context, grammar, and natural flow of language.
      Return only the words separated by commas, no explanations.
      Words should be common, grammatically correct, and contextually appropriate.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
      });

      const suggestions = response.choices[0].message.content
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0 && /^[a-zA-Z]+$/.test(s))
        .slice(0, 5);

      return suggestions.length > 0 ? suggestions : this.getFallbackNextWords(context);
    } catch (error) {
      console.error('Error getting next word suggestions:', error);
      return this.getFallbackNextWords(context);
    }
  }

  getFallbackCompletions(prefix) {
    const commonWords = [
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'her', 'been', 'than', 'its', 'who', 'oil',
      'use', 'may', 'water', 'than', 'very', 'what', 'know', 'just', 'first',
      'get', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can',
      'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here',
      'through', 'when', 'where', 'much', 'back', 'time', 'good', 'way', 'well',
      'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      'world', 'year', 'come', 'could', 'see', 'him', 'two', 'how', 'its',
      'our', 'out', 'up', 'other', 'many', 'then', 'them', 'would', 'like',
      'into', 'long', 'make', 'thing', 'look', 'more', 'go', 'do', 'take',
      'people', 'hand', 'place', 'house', 'great', 'right', 'small', 'large',
      'help', 'hello', 'happy', 'hope', 'home', 'heart', 'head', 'health',
      'beautiful', 'better', 'best', 'between', 'big', 'black', 'blue', 'book',
      'call', 'car', 'care', 'carry', 'case', 'change', 'child', 'clear',
      'close', 'color', 'come', 'company', 'country', 'course', 'create',
      'different', 'develop', 'door', 'down', 'during', 'each', 'early',
      'easy', 'economic', 'education', 'end', 'environment', 'even', 'every',
      'example', 'experience', 'fact', 'family', 'far', 'feel', 'few', 'find',
      'follow', 'food', 'form', 'friend', 'full', 'game', 'general', 'government',
      'group', 'grow', 'hand', 'happen', 'hard', 'head', 'health', 'hear',
      'high', 'history', 'hold', 'home', 'hope', 'hour', 'house', 'however',
      'human', 'idea', 'important', 'include', 'increase', 'indeed', 'information',
      'inside', 'instead', 'interest', 'international', 'issue', 'job', 'keep',
      'kind', 'know', 'language', 'large', 'last', 'late', 'learn', 'least',
      'leave', 'left', 'legal', 'less', 'level', 'light', 'line', 'list',
      'little', 'live', 'local', 'long', 'look', 'love', 'low', 'machine',
      'major', 'make', 'management', 'manager', 'market', 'material', 'matter',
      'mean', 'measure', 'media', 'medical', 'meet', 'member', 'mention',
      'method', 'middle', 'might', 'military', 'million', 'mind', 'minute',
      'miss', 'model', 'modern', 'moment', 'money', 'month', 'more', 'morning',
      'most', 'mother', 'move', 'movement', 'much', 'music', 'must', 'name',
      'nation', 'national', 'natural', 'nature', 'near', 'necessary', 'need',
      'network', 'never', 'news', 'newspaper', 'next', 'nice', 'night', 'nothing',
      'notice', 'number', 'occur', 'often', 'once', 'open', 'operation',
      'opportunity', 'option', 'order', 'organization', 'other', 'others',
      'outside', 'over', 'own', 'page', 'paper', 'parent', 'part', 'particular',
      'party', 'pass', 'past', 'pattern', 'pay', 'peace', 'people', 'perform',
      'performance', 'perhaps', 'period', 'person', 'personal', 'phone', 'physical',
      'pick', 'picture', 'piece', 'place', 'plan', 'plant', 'play', 'player',
      'point', 'policy', 'political', 'politics', 'poor', 'popular', 'population',
      'position', 'positive', 'possible', 'power', 'practice', 'prepare',
      'present', 'president', 'pressure', 'pretty', 'prevent', 'price',
      'private', 'probably', 'problem', 'process', 'produce', 'product',
      'production', 'professional', 'program', 'project', 'property', 'protect',
      'provide', 'public', 'purpose', 'put', 'quality', 'question', 'quickly',
      'quite', 'race', 'radio', 'raise', 'range', 'rate', 'rather', 'reach',
      'read', 'ready', 'real', 'reality', 'realize', 'really', 'reason',
      'receive', 'recent', 'recognize', 'record', 'red', 'reduce', 'reflect',
      'region', 'relate', 'relationship', 'religious', 'remain', 'remember',
      'remove', 'report', 'represent', 'require', 'research', 'resource',
      'respond', 'response', 'responsibility', 'rest', 'result', 'return',
      'reveal', 'rich', 'right', 'rise', 'risk', 'road', 'rock', 'role',
      'room', 'rule', 'run', 'safe', 'same', 'save', 'say', 'scene',
      'school', 'science', 'scientist', 'score', 'sea', 'season', 'seat',
      'second', 'section', 'security', 'see', 'seek', 'seem', 'sell',
      'send', 'senior', 'sense', 'series', 'serious', 'serve', 'service',
      'set', 'seven', 'several', 'sex', 'sexual', 'shake', 'share',
      'shoot', 'short', 'shot', 'should', 'shoulder', 'show', 'side',
      'significant', 'similar', 'simple', 'simply', 'since', 'sing',
      'single', 'sister', 'sit', 'site', 'situation', 'six', 'size',
      'skill', 'skin', 'small', 'smile', 'so', 'social', 'society',
      'soldier', 'some', 'somebody', 'someone', 'something', 'sometimes',
      'son', 'song', 'soon', 'sort', 'sound', 'source', 'south', 'southern',
      'space', 'speak', 'special', 'specific', 'speech', 'spend', 'sport',
      'spring', 'staff', 'stage', 'stand', 'standard', 'star', 'start',
      'state', 'statement', 'station', 'stay', 'step', 'still', 'stock',
      'stop', 'store', 'story', 'strategy', 'street', 'strong', 'structure',
      'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful',
      'such', 'suddenly', 'suffer', 'suggest', 'summer', 'support', 'sure',
      'surface', 'system', 'table', 'take', 'talk', 'task', 'tax', 'teach',
      'teacher', 'team', 'technology', 'television', 'tell', 'ten', 'tend',
      'term', 'test', 'than', 'thank', 'that', 'their', 'them', 'themselves',
      'then', 'theory', 'there', 'these', 'they', 'thing', 'think', 'third',
      'this', 'those', 'though', 'thought', 'thousand', 'threat', 'three',
      'through', 'throughout', 'throw', 'thus', 'time', 'today', 'together',
      'tonight', 'too', 'top', 'total', 'tough', 'toward', 'town', 'trade',
      'traditional', 'training', 'travel', 'treat', 'treatment', 'tree',
      'trial', 'trip', 'trouble', 'true', 'truth', 'try', 'turn', 'twelve',
      'twenty', 'two', 'type', 'under', 'understand', 'unit', 'until',
      'up', 'upon', 'use', 'used', 'user', 'usually', 'value', 'various',
      'very', 'victim', 'view', 'violence', 'visit', 'voice', 'wait',
      'walk', 'wall', 'want', 'war', 'watch', 'water', 'way', 'weapon',
      'wear', 'week', 'weight', 'well', 'west', 'western', 'what', 'whatever',
      'when', 'where', 'whether', 'which', 'while', 'white', 'who', 'whole',
      'whom', 'whose', 'why', 'wide', 'wife', 'will', 'win', 'wind',
      'window', 'wish', 'with', 'within', 'without', 'woman', 'wonder',
      'word', 'work', 'worker', 'world', 'worry', 'would', 'write',
      'writer', 'wrong', 'yard', 'yeah', 'year', 'yes', 'yet', 'you',
      'young', 'your', 'yourself'
    ];

    return commonWords
      .filter(word => word.startsWith(prefix.toLowerCase()))
      .slice(0, 5);
  }

  getFallbackNextWords(context) {
    const words = context.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];

    const commonNextWords = {
      'the': ['cat', 'dog', 'house', 'car', 'book', 'world', 'time', 'way'],
      'i': ['am', 'was', 'will', 'have', 'think', 'want', 'like', 'need'],
      'you': ['are', 'were', 'will', 'have', 'can', 'should', 'want', 'need'],
      'is': ['a', 'an', 'the', 'not', 'very', 'quite', 'really', 'being'],
      'are': ['not', 'you', 'we', 'they', 'being', 'going', 'coming', 'here'],
      'and': ['the', 'i', 'you', 'we', 'they', 'it', 'then', 'now'],
      'to': ['be', 'do', 'go', 'see', 'get', 'make', 'take', 'have'],
      'in': ['the', 'a', 'an', 'this', 'that', 'order', 'time', 'fact'],
      'on': ['the', 'a', 'top', 'time', 'fire', 'purpose', 'earth', 'board'],
      'at': ['the', 'a', 'least', 'last', 'first', 'home', 'work', 'school'],
      'will': ['be', 'have', 'go', 'come', 'take', 'make', 'get', 'see'],
      'can': ['be', 'do', 'go', 'see', 'get', 'make', 'take', 'help'],
      'this': ['is', 'was', 'will', 'can', 'could', 'should', 'would', 'might'],
      'that': ['is', 'was', 'will', 'can', 'could', 'should', 'would', 'might'],
      'have': ['a', 'an', 'the', 'been', 'to', 'not', 'you', 'they'],
      'with': ['a', 'an', 'the', 'you', 'me', 'him', 'her', 'them'],
      'for': ['a', 'an', 'the', 'you', 'me', 'him', 'her', 'them'],
      'it': ['is', 'was', 'will', 'can', 'could', 'should', 'would', 'might'],
      'was': ['a', 'an', 'the', 'not', 'very', 'quite', 'really', 'being'],
      'were': ['not', 'you', 'we', 'they', 'being', 'going', 'coming', 'here']
    };

    return commonNextWords[lastWord] || ['and', 'the', 'to', 'of', 'in', 'for', 'with', 'on'];
  }

  getStarterWords() {
    return ['the', 'i', 'you', 'it', 'we', 'they', 'this', 'that'];
  }

  getCurrentText() {
    return this.currentSentence + this.currentWord;
  }

  async processSuggestionSelection(suggestion) {
    try {
      if (this.currentWord) {
        // Replace current word with suggestion
        this.currentSentence += suggestion;
        this.currentWord = '';
      } else {
        // Add suggestion as next word
        if (this.currentSentence && !this.currentSentence.endsWith(' ')) {
          this.currentSentence += ' ';
        }
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
