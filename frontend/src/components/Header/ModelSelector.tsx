import React, { useState } from 'react';
import { ChevronDown, Eye, Sparkles } from 'lucide-react';
import type { ModelInfo } from '../../types';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeModel = models.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split('/')[1] || selectedModel,
    supports_vision: selectedModel.includes('gemma-3') || selectedModel.includes('gemini'),
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-glass)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'var(--transition-fast)',
        }}
      >
        <Sparkles size={14} style={{ color: 'var(--primary)' }} />
        <span>{activeModel.name.replace('(Free)', '')}</span>
        {activeModel.supports_vision && (
          <span
            title="Supports Vision & Images"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--accent-pink)',
            }}
          >
            <Eye size={14} />
          </span>
        )}
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              background: '#111726',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              zIndex: 50,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Select OpenRouter AI Model
            </div>

            {models.map((m) => {
              const isSelected = m.id === selectedModel;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      {m.name}
                    </span>
                    {m.supports_vision && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(236, 72, 153, 0.2)',
                          color: 'var(--accent-pink)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Eye size={10} /> Vision
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    {m.description}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
