import { getAutocompleteEngine } from '../../../lib/autocomplete';

export async function GET(request) {
  try {
    const engine = getAutocompleteEngine();
    
    return Response.json({
      currentText: engine.getCurrentText(),
      isWordComplete: !engine.currentWord
    });
  } catch (error) {
    console.error('Error in current-text:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
