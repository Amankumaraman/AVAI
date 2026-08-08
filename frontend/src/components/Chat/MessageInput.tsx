import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Zap, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string, imagePayload?: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  attachedImage: string | null;
  onSetAttachedImage: (img: string | null) => void;
  onOpenCamera: () => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  liveTranscript: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  isListening,
  onToggleListening,
  attachedImage,
  onSetAttachedImage,
  liveTranscript,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (liveTranscript) {
      setText(liveTranscript);
    }
  }, [liveTranscript]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryText = text.trim();
    if ((!queryText && !attachedImage) || isLoading) return;

    onSendMessage(queryText, attachedImage || undefined);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const [isCapturing, setIsCapturing] = useState(false);

  // Instant Screen Capture & Analyze — fully automatic, no dialog, sub-100ms
  const handleAnalyzeScreen = async () => {
    if (isCapturing || isLoading) return;
    setIsCapturing(true);
    try {
      // Call backend to capture the screen (minimizes AVAI window, screenshots, restores)
      const res = await fetch('http://127.0.0.1:8000/api/window/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.status === 'ok' && data.image) {
        const promptText =
          text.trim() ||
          'Analyze this screen capture carefully. Identify and solve the coding problem, math question, or study query shown on the screen step-by-step with clean code and high-impact explanations.';
        onSendMessage(promptText, data.image);
        setText('');
      } else {
        console.warn('Screenshot failed:', data.message);
      }
    } catch (err) {
      console.warn('Screen capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      style={{
        padding: '10px 14px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-glass)',
      }}
    >
      {/* Attached Image Thumbnail Pill */}
      {attachedImage && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '8px',
          }}
        >
          <img
            src={attachedImage}
            alt="Attachment preview"
            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '0.75rem', color: '#fff' }}>Screen capture attached</span>
          <button
            onClick={() => onSetAttachedImage(null)}
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Pill Input Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-glass)',
            borderRadius: '100px',
            padding: '0 12px',
            height: '36px',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speaker... Type or press Enter'
                : 'Type a message & press Enter...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
            }}
          />

          {/* Mic Button */}
          <button
            type="button"
            onClick={onToggleListening}
            style={{
              background: 'transparent',
              color: isListening ? 'var(--accent-pink)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isListening ? 'Stop Mic' : 'Start Mic'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Send Icon Button */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={isLoading || (!text.trim() && !attachedImage)}
            style={{
              background: 'transparent',
              color: 'var(--primary)',
              opacity: isLoading || (!text.trim() && !attachedImage) ? 0.3 : 1,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Send Message (Enter)"
          >
            <Send size={16} />
          </button>
        </div>

        {/* 'Analyze Screen' Button */}
        <button
          type="button"
          onClick={handleAnalyzeScreen}
          disabled={isLoading || isCapturing}
          style={{
            height: '36px',
            padding: '0 14px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid var(--border-glow)',
            color: '#fff',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isLoading || isCapturing ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-neon)',
            transition: 'var(--transition-fast)',
            opacity: isLoading || isCapturing ? 0.6 : 1,
          }}
          title="Capture active screen and analyze question or problem"
        >
          <Zap size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>{isCapturing ? 'Capturing...' : 'Analyze Screen'}</span>
        </button>
      </form>
    </div>
  );
};
