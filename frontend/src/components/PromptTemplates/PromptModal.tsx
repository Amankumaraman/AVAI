import React from 'react';
import { X, Sparkles, Code, Eye, Calculator, BookOpen, Compass, Feather } from 'lucide-react';
import type { PromptTemplate } from '../../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    title: 'Code Review & Refactor',
    description: 'Analyze code snippets for performance, security, and clean code best practices.',
    category: 'code',
    prompt: 'Please review the following code snippet for potential performance issues, bugs, and suggest a refactored modern version:\n\n```js\n// Paste code here\n```',
    icon: 'code',
  },
  {
    id: 'vision-analyze',
    title: 'Image Scene Analyzer',
    description: 'Detailed breakdown of objects, text, color palette, and context in photos.',
    category: 'vision',
    prompt: 'Identify all key elements in this image, transcribe any text visible, and summarize what is happening in detail.',
    icon: 'eye',
  },
  {
    id: 'math-solver',
    title: 'Math & Logic Solver',
    description: 'Step-by-step mathematical problem solving with explanations.',
    category: 'general',
    prompt: 'Solve the following math or logic problem step-by-step showing all calculations:\n\n',
    icon: 'calculator',
  },
  {
    id: 'language-tutor',
    title: 'Conversational Voice Tutor',
    description: 'Practice speaking and grammar corrections in conversational style.',
    category: 'study',
    prompt: 'Act as a patient conversational language tutor. Correct any grammatical errors gently and keep questions engaging.',
    icon: 'book',
  },
  {
    id: 'creative-writing',
    title: 'Creative Story & Scripts',
    description: 'Brainstorm creative story plots, dialogue, or marketing copy.',
    category: 'creative',
    prompt: 'Write a compelling short story plot centered around a futuristic voice assistant with human emotions.',
    icon: 'feather',
  },
  {
    id: 'fastapi-explainer',
    title: 'FastAPI Architecture',
    description: 'Explain asynchronous web concepts, dependencies, and API routers.',
    category: 'code',
    prompt: 'Explain how FastAPI dependency injection works under the hood with clear code examples.',
    icon: 'compass',
  },
];

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code size={20} style={{ color: 'var(--accent-cyan)' }} />;
      case 'eye':
        return <Eye size={20} style={{ color: 'var(--accent-pink)' }} />;
      case 'calculator':
        return <Calculator size={20} style={{ color: 'var(--accent-amber)' }} />;
      case 'book':
        return <BookOpen size={20} style={{ color: 'var(--accent-emerald)' }} />;
      case 'feather':
        return <Feather size={20} style={{ color: 'var(--primary)' }} />;
      default:
        return <Compass size={20} style={{ color: 'var(--primary)' }} />;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Prompt Templates & Ideas
            </h3>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
            maxHeight: '60vh',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectPrompt(tmpl.prompt);
                onClose();
              }}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'var(--transition-normal)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {renderIcon(tmpl.icon)}
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  {tmpl.title}
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {tmpl.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
