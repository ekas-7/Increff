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
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="w-full h-32 p-4 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg text-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Start typing or use the virtual keyboard..."
                  readOnly
                />
                {isLoading && (
                  <div className="absolute top-2 right-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                )}
              </div>
              
              {/* Status Indicator */}
              <div className="mt-2 text-sm text-gray-300">
                Status: {isWordComplete ? 'Ready for next word' : 'Typing current word'}
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
