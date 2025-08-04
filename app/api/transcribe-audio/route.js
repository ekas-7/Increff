import dbConnect from '../../../lib/mongodb';
import { getAutocompleteEngine } from '../../../lib/autocomplete';
import { Context } from '../../../lib/models';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    await dbConnect();
    
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

    // Note: In a real implementation, you'd need to handle audio file upload
    // For now, this is a placeholder for the audio transcription logic
    console.log('Processing audio file...');
    
    // Placeholder transcription - in real implementation, use OpenAI Whisper
    const transcription = "Hello world this is a test"; // Replace with actual transcription
    
    const engine = getAutocompleteEngine();
    engine.setSentence(transcription);
    
    // Save the transcribed sentence context
    await Context.create({
      sentence: transcription,
      words: transcription.split(/\s+/)
    });
    
    return NextResponse.json({
      transcription,
      currentText: engine.getCurrentText(),
      suggestions: await engine.getNextWordSuggestions()
    });
  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
