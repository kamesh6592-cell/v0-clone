'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface SpeechRecognitionProps {
  onTranscript?: (transcript: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function SpeechRecognition({
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  language = 'en-US',
  continuous = true,
  interimResults = true,
}: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          onSpeechStart?.();
        };

        recognition.onend = () => {
          setIsListening(false);
          onSpeechEnd?.();
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            onTranscript?.(finalTranscript);
          }

          setInterimTranscript(interim);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onTranscript, onSpeechStart, onSpeechEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  if (!isSupported) {
    return null;
  }

  return {
    isListening,
    transcript: transcript + interimTranscript,
    finalTranscript: transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  };
}

export function SpeechRecognitionButton({
  isListening,
  onStart,
  onStop,
  disabled = false,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={isListening ? "default" : "outline"}
      size="sm"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={`flex items-center gap-2 transition-all ${
        isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''
      }`}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          Stop
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          Speak
        </>
      )}
    </Button>
  );
}

// Text-to-Speech Component
export function TextToSpeech({
  text,
  language = 'en-US',
  rate = 1,
  pitch = 1,
  volume = 1,
}: {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback(() => {
    if (!isSupported || !text) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, language, rate, pitch, volume, isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isSpeaking ? stop : speak}
      disabled={!text}
      className="flex items-center gap-2"
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          Speak
        </>
      )}
    </Button>
  );
}

// Combined Speech Component
export function SpeechInterface({
  onTranscript,
  textToSpeak,
  language = 'en-US',
}: {
  onTranscript?: (transcript: string) => void;
  textToSpeak?: string;
  language?: string;
}) {
  const speech = SpeechRecognition({
    onTranscript,
    language,
    continuous: true,
    interimResults: true,
  });

  if (!speech || !speech.isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Speech recognition not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SpeechRecognitionButton
        isListening={speech.isListening}
        onStart={speech.startListening}
        onStop={speech.stopListening}
      />
      
      {textToSpeak && (
        <TextToSpeech text={textToSpeak} language={language} />
      )}

      {speech.transcript && (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {speech.transcript}
        </div>
      )}
    </div>
  );
}