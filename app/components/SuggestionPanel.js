'use client';

const SuggestionPanel = ({ suggestions, onSuggestionClick, isLoading, suggestionType }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-gray-300">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🤔</div>
          <p>No suggestions available</p>
          <p className="text-sm mt-1">
            {suggestionType === 'next-word' 
              ? 'Start typing to get word completion suggestions'
              : 'Complete the current word to get next word suggestions'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Suggestion type indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          suggestionType === 'next-word' ? 'bg-green-400' : 'bg-blue-400'
        }`}></div>
        <span>
          {suggestionType === 'next-word' ? 'Next Word Suggestions' : 'Word Completions'}
        </span>
      </div>

      {/* Suggestions list */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion}-${index}`}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-3 bg-gray-800 hover:bg-blue-900 hover:border-blue-500 border border-gray-600 rounded-lg transition-all duration-200 group"
            disabled={isLoading}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-100 font-medium group-hover:text-blue-200">
                {suggestion}
              </span>
              <div className="flex items-center gap-2">
                {/* Suggestion type icon */}
                <span className="text-xs text-gray-400">
                  {suggestionType === 'next-word' ? '→' : '↻'}
                </span>
                {/* Click indicator */}
                <span className="text-xs text-gray-500 group-hover:text-blue-300">
                  Click to use
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Suggestion count */}
      <div className="text-xs text-gray-400 text-center mt-4">
        {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} available
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-300 text-center mt-2 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span>💡</span>
          <span className="font-medium">Tip:</span>
        </div>
        {suggestionType === 'next-word' 
          ? 'These suggestions are based on AI analysis and your typing patterns'
          : 'Type more letters to get better word completions'
        }
      </div>
    </div>
  );
};

export default SuggestionPanel;
