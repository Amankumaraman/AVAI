import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
}

export function useSpeechSynthesis({
  voiceName,
  rate = 1.0,
  pitch = 1.0,
}: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (synthRef.current) {
          const available = synthRef.current.getVoices();
          setVoices(available);
        }
      };

      updateVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = updateVoices;
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !text) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      // Clean markdown tags or code blocks for speech reading
      const cleanText = text
        .replace(/```[\s\S]*?```/g, ' Code snippet omitted for brevity. ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_~#]/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;

      if (voiceName) {
        const selected = voices.find((v) => v.name === voiceName);
        if (selected) {
          utterance.voice = selected;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    },
    [voices, voiceName, rate, pitch]
  );

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    voices,
    isSupported,
    speak,
    stop,
  };
}
