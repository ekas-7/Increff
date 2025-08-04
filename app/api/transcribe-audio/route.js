import { getAutocompleteEngine } from '../../../lib/autocomplete';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Check if request has content
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    let audioFile;
    try {
      // Handle FormData (multipart/form-data)
      if (contentType && contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        audioFile = formData.get('audio');
        
        if (!audioFile) {
          return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }
        
        console.log('Audio file received:', audioFile.name, audioFile.type, audioFile.size);
      } else {
        // Handle JSON payload (fallback)
        const body = await request.json();
        if (!body || !body.audio) {
          return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
        }
        audioFile = body.audio;
      }
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format', 
        details: parseError.message 
      }, { status: 400 });
    }

    // Use OpenAI Whisper for transcription
    try {
      console.log('Processing audio file with OpenAI Whisper...');
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "text"
      });
      
      console.log('Transcription result:', transcription);
      
      const engine = getAutocompleteEngine();
      engine.setSentence(transcription);
      
      return NextResponse.json({
        transcription,
        currentText: engine.getCurrentText(),
        suggestions: await engine.getNextWordSuggestions()
      });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      
      // Fallback transcription for demo purposes
      const fallbackTranscription = "Hello world this is a test";
      const engine = getAutocompleteEngine();
      engine.setSentence(fallbackTranscription);
      
      return NextResponse.json({
        transcription: fallbackTranscription,
        currentText: engine.getCurrentText(),
        suggestions: await engine.getNextWordSuggestions(),
        note: "Used fallback transcription due to processing error"
      });
    }
  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
