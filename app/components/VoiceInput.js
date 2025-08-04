'use client';

import { useState, useRef } from 'react';

const VoiceInput = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const API_BASE_URL = '/api';

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        await sendAudioToServer(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onTranscription(data.transcription);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to transcribe audio');
      }
    } catch (err) {
      console.error('Error sending audio:', err);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-4">
      {/* Main recording button */}
      <div className="flex flex-col items-center">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`
            relative w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center
            ${isRecording 
              ? 'bg-red-600 border-red-500 hover:bg-red-700 animate-pulse shadow-lg' 
              : isProcessing
                ? 'bg-yellow-600 border-yellow-500 cursor-not-allowed'
                : 'bg-blue-600 border-blue-500 hover:bg-blue-700 hover:shadow-lg'
            }
            ${!isProcessing ? 'active:scale-95' : ''}
          `}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : (
            <svg 
              className="w-8 h-8 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              {isRecording ? (
                <rect x="6" y="4" width="8" height="12" rx="1" />
              ) : (
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              )}
            </svg>
          )}
        </button>

        {/* Recording status */}
        <div className="mt-3 text-center">
          <div className={`text-lg font-medium ${
            isRecording ? 'text-red-400' : 
            isProcessing ? 'text-yellow-400' : 
            'text-gray-300'
          }`}>
            {isRecording ? 'Recording...' : 
             isProcessing ? 'Processing...' : 
             'Click to Record'}
          </div>
          
          {isRecording && (
            <div className="text-sm text-gray-400 mt-1">
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
      </div>

      {/* Recording controls and info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Voice Instructions</h3>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Click the microphone to start recording</li>
          <li>• Speak clearly and at normal pace</li>
          <li>• Click again to stop and process</li>
          <li>• Make sure your microphone is enabled</li>
        </ul>

        {/* Recording quality indicator */}
        {isRecording && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-300">Audio Quality:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 h-3 rounded-full ${
                    bar <= 3 ? 'bg-green-500' : 'bg-gray-600'
                  } animate-pulse`}
                  style={{ animationDelay: `${bar * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Browser compatibility warning */}
      {typeof window !== 'undefined' && !navigator.mediaDevices && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-200">
              Voice input may not be supported in this browser. Try Chrome, Firefox, or Safari.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
