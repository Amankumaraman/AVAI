import { useState, useEffect, useRef, useCallback } from 'react';

// Declaration for SpeechRecognition web API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  onTranscriptFinalized?: (transcript: string) => void;
  continuous?: boolean;
  language?: string;
  autoSubmitSilenceMs?: number; // e.g. 1500ms of silence auto-submits question
}

export function useSpeechRecognition({
  onTranscriptFinalized,
  continuous = true,
  language = 'en-US',
  autoSubmitSilenceMs = 1600,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');

  const submitCurrentSpeech = useCallback(() => {
    const textToSubmit = accumulatedTranscriptRef.current.trim();
    if (textToSubmit.length > 2) {
      if (onTranscriptFinalized) {
        onTranscriptFinalized(textToSubmit);
      }
    }
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, [onTranscriptFinalized]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (autoSubmitSilenceMs > 0) {
      silenceTimerRef.current = setTimeout(() => {
        submitCurrentSpeech();
      }, autoSubmitSilenceMs);
    }
  }, [autoSubmitSilenceMs, submitCurrentSpeech]);

  // Silent background microphone stream pre-grant check
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Release test stream immediately
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + currentFinal).trim();
          setTranscript(accumulatedTranscriptRef.current);
        }
        setInterimTranscript(currentInterim);

        // Reset silence timer on every spoken phrase
        resetSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
          setError(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart if user enabled continuous interview listening mode
        if (shouldBeListeningRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // ignore duplicate start errors
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      setIsSupported(false);
      setError(`Failed to initialize speech recognition: ${err?.message || err}`);
    }
  }, [continuous, language, resetSilenceTimer]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldBeListeningRef.current = true;
    try {
      setTranscript('');
      setInterimTranscript('');
      accumulatedTranscriptRef.current = '';
      setError(null);
      recognitionRef.current.start();
    } catch (e: any) {
      console.warn('Start listening warning:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.warn('Stop listening warning:', e);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: (transcript + ' ' + interimTranscript).trim(),
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
