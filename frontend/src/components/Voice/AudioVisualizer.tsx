import React from 'react';
import { Volume2, Mic } from 'lucide-react';

interface AudioVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStopSpeaking?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  isSpeaking,
  onStopSpeaking,
}) => {
  if (!isListening && !isSpeaking) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: isListening
          ? 'rgba(99, 102, 241, 0.15)'
          : 'rgba(6, 182, 212, 0.15)',
        border: `1px solid ${
          isListening ? 'rgba(99, 102, 241, 0.4)' : 'rgba(6, 182, 212, 0.4)'
        }`,
        borderRadius: 'var(--radius-md)',
        margin: '0 20px 12px 20px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isListening ? 'var(--primary)' : 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: isListening
              ? '0 0 15px rgba(99, 102, 241, 0.6)'
              : '0 0 15px rgba(6, 182, 212, 0.6)',
          }}
        >
          {isListening ? <Mic size={18} className="animate-pulse" /> : <Volume2 size={18} />}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {isListening ? 'Listening continuously...' : 'Speaking AI response...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isListening ? 'Speak into your microphone' : 'Click stop to cancel speech synthesis'}
          </div>
        </div>
      </div>

      {/* Audio Wave Animated Equalizer Bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '28px' }}>
        {[12, 24, 16, 28, 18, 26, 14, 20].map((h, idx) => (
          <div
            key={idx}
            style={{
              width: '4px',
              borderRadius: '4px',
              background: isListening ? 'var(--primary)' : 'var(--accent-cyan)',
              height: `${h}px`,
              animation: `waveBar 1s ease-in-out infinite alternate`,
              animationDelay: `${idx * 0.12}s`,
            }}
          />
        ))}
      </div>

      {isSpeaking && onStopSpeaking && (
        <button
          onClick={onStopSpeaking}
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Stop Speaking
        </button>
      )}
    </div>
  );
};
