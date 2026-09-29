import { useState, useEffect, useRef, useCallback } from 'react';

// Supported voice input languages configuration
export const VOICE_LANGUAGES = [
  {
    code: "en-IN",
    name: "English (India)",
    shortName: "EN"
  },
  {
    code: "ta-IN",
    name: "Tamil",
    shortName: "தமிழ்"
  },
  {
    code: "hi-IN",
    name: "Hindi",
    shortName: "हिन्दी"
  },
  {
    code: "te-IN",
    name: "Telugu",
    shortName: "తెలుగు"
  },
  {
    code: "ml-IN",
    name: "Malayalam",
    shortName: "മലയാളം"
  },
  {
    code: "kn-IN",
    name: "Kannada",
    shortName: "ಕನ್ನಡ"
  }
];

const DEFAULT_LANGUAGE = "en-IN";
const STORAGE_KEY = "chatbot_voice_language";

// Check browser support for Speech Recognition
const SpeechRecognition = 
  window.SpeechRecognition || 
  window.webkitSpeechRecognition;

const isSupported = !!SpeechRecognition;

/**
 * Custom hook for managing speech recognition
 * @param {function} onTranscript - Callback when final transcript is received
 * @param {function} onInterimTranscript - Callback for interim results
 */
export function useSpeechRecognition(onTranscript, onInterimTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Restore from localStorage or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });
  const [error, setError] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Initialize recognition instance
  useEffect(() => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      finalTranscriptRef.current = '';
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current = final;
        if (onTranscript) {
          onTranscript(final);
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        if (onInterimTranscript) {
          onInterimTranscript(interim);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          break;
        case 'no-speech':
          // Don't show error for no speech - just stop listening
          setError(null);
          break;
        case 'audio-capture':
          setError('No microphone was found. Please ensure a microphone is connected.');
          break;
        case 'network':
          setError('Network error occurred. Please check your internet connection.');
          break;
        case 'aborted':
          // Recognition was aborted - normal when stopping
          setError(null);
          break;
        default:
          setError('An error occurred during voice recognition. Please try again.');
      }
      
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [selectedLanguage, onTranscript, onInterimTranscript]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      return;
    }

    setError(null);
    
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start voice recognition. Please try again.');
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!isListening) {
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error('Failed to stop recognition:', err);
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, [isListening]);

  // Change language
  const changeLanguage = useCallback((languageCode) => {
    // Stop current session if active
    if (isListening) {
      stopListening();
    }

    setSelectedLanguage(languageCode);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, languageCode);
    }
  }, [isListening, stopListening]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    selectedLanguage,
    error,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    changeLanguage,
    clearError: () => setError(null)
  };
}
