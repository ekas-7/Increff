import dbConnect from '../../../lib/mongodb';
import { getAutocompleteEngine } from '../../../lib/autocomplete';

export async function POST(request) {
  try {
    await dbConnect();
    
    const engine = getAutocompleteEngine();
    await engine.removeCharacter();
    
    let suggestions = [];
    if (engine.currentWord) {
      suggestions = await engine.getCompletionSuggestions(engine.currentWord);
    } else {
      suggestions = await engine.getNextWordSuggestions();
    }
    
    return Response.json({
      currentText: engine.getCurrentText(),
      suggestions,
      isWordComplete: !engine.currentWord
    });
  } catch (error) {
    console.error('Error in remove-character:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
