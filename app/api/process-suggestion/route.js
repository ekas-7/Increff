import dbConnect from '../../../lib/mongodb';
import { getAutocompleteEngine } from '../../../lib/autocomplete';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { suggestion } = await request.json();
    
    if (typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      return Response.json({ 
        error: 'Suggestion must be a non-empty string' 
      }, { status: 400 });
    }

    const engine = getAutocompleteEngine();
    const result = await engine.processSuggestionSelection(suggestion);
    
    let newSuggestions = [];
    if (engine.currentWord) {
      newSuggestions = await engine.getCompletionSuggestions(engine.currentWord);
    } else {
      newSuggestions = await engine.getNextWordSuggestions();
    }
    
    return Response.json({
      ...result,
      suggestions: newSuggestions,
      isWordComplete: !engine.currentWord
    });
  } catch (error) {
    console.error('Error in process-suggestion:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
