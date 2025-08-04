'use client';

import { useState, useEffect, useRef } from 'react';
import VirtualKeyboard from './components/VirtualKeyboard';
import SuggestionPanel from './components/SuggestionPanel';
import VoiceInput from './components/VoiceInput';

export default function Home() {
  const [currentText, setCurrentText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textAreaRef = useRef(null);

  const API_BASE_URL = '/api';

  useEffect(() => {
    // Focus on text area when component mounts
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  const handleKeyPress = async (character) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/add-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentText(data.currentText);
        setSuggestions(data.suggestions || []);
        setIsWordComplete(data.isWordComplete);
      }
    } catch (error) {
      console.error('Error sending character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackspace = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/remove-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentText(data.currentText);
        setSuggestions(data.suggestions || []);
        setIsWordComplete(data.isWordComplete);
      }
    } catch (error) {
      console.error('Error removing character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/process-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestion }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentText(data.currentText);
        setSuggestions(data.suggestions || []);
        setIsWordComplete(data.isWordComplete);
      }
    } catch (error) {
      console.error('Error processing suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscription = async (transcription) => {
    setCurrentText(transcription);
    // Fetch new suggestions after voice input
    try {
      const response = await fetch(`${API_BASE_URL}/current-text`);
      if (response.ok) {
        const data = await response.json();
        setIsWordComplete(data.isWordComplete);
      }
    } catch (error) {
      console.error('Error getting current text state:', error);
    }
  };

  // Handle physical keyboard input
  const handlePhysicalKeyDown = async (e) => {
    if (isLoading) return; // Ignore input while processing

    // Handle special key combinations
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a') {
        // Allow Ctrl+A/Cmd+A for select all
        return;
      } else if (e.key === 'c' || e.key === 'v' || e.key === 'x') {
        // Allow copy/paste/cut operations
        return;
      }
      // Prevent other Ctrl/Cmd combinations
      e.preventDefault();
      return;
    }

    // Handle Tab key to select first suggestion
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      await handleSuggestionClick(suggestions[0]);
      return;
    }

    // Handle number keys (1-9) to select suggestions by index
    if (e.key >= '1' && e.key <= '9' && e.altKey && suggestions.length > 0) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      if (index < suggestions.length) {
        await handleSuggestionClick(suggestions[index]);
      }
      return;
    }

    // Handle Enter key to add a new line or space
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleKeyPress('\n');
      return;
    }

    // Handle arrow keys (ignore for now, could be used for suggestion navigation)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault(); // Prevent default textarea behavior
    
    if (e.key === 'Backspace') {
      await handleBackspace();
    } else if (e.key.length === 1) {
      // Single character input (letters, numbers, symbols, space)
      await handleKeyPress(e.key);
    }
  };

  // Handle direct text change (for copy-paste or other text modifications)
  const handleTextChange = async (e) => {
    const newText = e.target.value;
    
    if (newText === currentText) return; // No change
    
    if (newText.length > currentText.length) {
      // Text was added (could be paste or other input)
      const addedText = newText.slice(currentText.length);
      for (const char of addedText) {
        await handleKeyPress(char);
      }
    } else if (newText.length < currentText.length) {
      // Text was removed
      const removedCount = currentText.length - newText.length;
      for (let i = 0; i < removedCount; i++) {
        await handleBackspace();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">
            AI-Enhanced Autocomplete System
          </h1>
          <p className="text-gray-300">
            Start typing or use voice input to experience intelligent text completion
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Text Input Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Text Input</h2>
              <div className="relative">
                <textarea
                  ref={textAreaRef}
                  value={currentText}
                  onChange={handleTextChange}
                  onKeyDown={handlePhysicalKeyDown}
                  className="w-full h-32 p-4 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg text-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Start typing with your keyboard, use the virtual keyboard, or voice input..."
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="absolute top-2 right-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                )}
              </div>
              
              {/* Status Indicator */}
              <div className="mt-2 flex justify-between items-center text-sm text-gray-300">
                <span>Status: {isWordComplete ? 'Ready for next word' : 'Typing current word'}</span>
                <span className="text-xs text-gray-400">💡 Use physical keyboard, virtual keyboard, or voice input</span>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-300 font-medium mb-2">⌨️ Keyboard Shortcuts:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-400">
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Tab</kbd> - Use first suggestion</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Alt+1-9</kbd> - Use suggestion by number</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Enter</kbd> - New line</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Backspace</kbd> - Delete character</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Ctrl+A</kbd> - Select all</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-600 rounded text-gray-200">Ctrl+C/V</kbd> - Copy/Paste</div>
                </div>
              </div>
            </div>

            {/* Virtual Keyboard */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Virtual Keyboard</h2>
              <VirtualKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                disabled={isLoading}
              />
            </div>

            {/* Voice Input */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Voice Input</h2>
              <VoiceInput onTranscription={handleVoiceTranscription} />
            </div>
          </div>

          {/* Suggestions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                {isWordComplete ? 'Next Word Suggestions' : 'Word Completion'}
              </h2>
              <SuggestionPanel
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                isLoading={isLoading}
                suggestionType={isWordComplete ? 'next-word' : 'completion'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>Powered by OpenAI GPT and MongoDB</p>
        </div>
      </div>
    </div>
  );
}
