import { getAutocompleteEngine } from '../../../lib/autocomplete';

export async function POST(request) {
  try {
    const { character } = await request.json();
    
    if (typeof character !== 'string' || character.length !== 1) {
      return Response.json({ 
        error: 'Character must be a single string character' 
      }, { status: 400 });
    }

    const engine = getAutocompleteEngine();
    await engine.addCharacter(character);
    
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
    console.error('Error in add-character:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
