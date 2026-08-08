import React from 'react';
import { Bot, Settings as SettingsIcon, EyeOff, Trash2, Code, MessageSquare, Minus } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import type { ModelInfo, Message, ProfileType, AnswerMode, TechRole } from '../../types';

interface NavbarProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  selectedProfile: ProfileType;
  onSelectProfile: (profile: ProfileType) => void;
  answerMode: AnswerMode;
  onToggleAnswerMode: (mode: AnswerMode) => void;
  techRole: TechRole;
  onSelectTechRole: (role: TechRole) => void;
  onOpenSettings: () => void;
  onOpenPrompts?: () => void;
  onClearHistory: () => void;
  messages: Message[];
  isStealthMode?: boolean;
  onToggleStealthMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  models,
  selectedModel,
  onSelectModel,
  selectedProfile,
  onSelectProfile,
  answerMode,
  onToggleAnswerMode,
  techRole,
  onSelectTechRole,
  onOpenSettings,
  onClearHistory,
  messages,
  isStealthMode,
  onToggleStealthMode,
}) => {
  return (
    <header className="navbar pywebview-drag-region" style={{ padding: '6px 12px', gap: '6px', flexWrap: 'wrap' }}>
      <div className="nav-brand" style={{ gap: '8px', alignItems: 'center' }}>
        {/* Apple macOS Traffic Light Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
          <button
            type="button"
            onClick={() => {
              fetch('http://127.0.0.1:8000/api/window/close', { method: 'POST' }).catch(() => {
                window.close();
              });
            }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff5f56',
              border: '1px solid rgba(255, 95, 86, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 0 5px rgba(255, 95, 86, 0.5)',
              padding: 0,
            }}
            title="Exit Application (Close Process)"
          />
          <button
            type="button"
            onClick={() => {
              fetch('http://127.0.0.1:8000/api/window/hide', { method: 'POST' }).catch(() => {});
            }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffbd2e',
              border: '1px solid rgba(255, 189, 46, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 0 5px rgba(255, 189, 46, 0.5)',
              padding: 0,
            }}
            title="Minimize Floating Window (Ctrl+\)"
          />
        </div>

        <div
          className="brand-icon"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Bot size={15} />
        </div>
        <span className="brand-title" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
          AVAI
        </span>
      </div>

      <div className="nav-actions" style={{ gap: '6px', flexWrap: 'wrap' }}>
        {/* Answer Mode Toggle Pill (Verbal Pointers vs Deep Code) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            borderRadius: '100px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => onToggleAnswerMode('verbal')}
            style={{
              padding: '3px 8px',
              borderRadius: '100px',
              background: answerMode === 'verbal' ? 'var(--primary)' : 'transparent',
              color: answerMode === 'verbal' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: answerMode === 'verbal' ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Verbal Pointers Mode (3 bullet points ready to speak out loud)"
          >
            <MessageSquare size={12} />
            <span>Verbal</span>
          </button>
          <button
            onClick={() => onToggleAnswerMode('code')}
            style={{
              padding: '3px 8px',
              borderRadius: '100px',
              background: answerMode === 'code' ? 'var(--accent-cyan)' : 'transparent',
              color: answerMode === 'code' ? '#000' : 'var(--text-muted)',
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: answerMode === 'code' ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Deep Code Mode (Full code implementations & Big-O complexity)"
          >
            <Code size={12} />
            <span>Code</span>
          </button>
        </div>

        {/* Tech Stack & Role Preset Dropdown */}
        <select
          value={techRole}
          onChange={(e) => onSelectTechRole(e.target.value as TechRole)}
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 6px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Select Tech Stack Role Preset"
        >
          <option value="backend">🐍 Python/Backend</option>
          <option value="frontend">⚛️ React/Frontend</option>
          <option value="data">📊 Data Science/ML</option>
          <option value="devops">☁️ DevOps/Cloud</option>
          <option value="general">💼 General Tech</option>
        </select>

        {/* Profile Selector Dropdown */}
        <select
          value={selectedProfile}
          onChange={(e) => onSelectProfile(e.target.value as ProfileType)}
          style={{
            background: 'var(--bg-card-hover)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 6px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Select Session Profile"
        >
          <option value="interview">🎯 Job Interview</option>
          <option value="sales">💼 Sales Call</option>
          <option value="meeting">👥 Business Meeting</option>
          <option value="presentation">📊 Presentation</option>
          <option value="negotiation">🤝 Negotiation</option>
          <option value="exam">📝 Exam Assistant</option>
        </select>

        {/* Model Selector */}
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
        />

        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="icon-btn"
            title="Clear Chat"
            style={{ width: '28px', height: '28px' }}
          >
            <Trash2 size={14} />
          </button>
        )}

        {onToggleStealthMode && (
          <button
            onClick={onToggleStealthMode}
            className="icon-btn"
            title={isStealthMode ? 'Show Overlay (Esc / Alt+H)' : 'Hide Overlay (Esc / Alt+H)'}
            style={{
              width: '28px',
              height: '28px',
              color: isStealthMode ? 'var(--accent-pink)' : 'var(--text-muted)',
            }}
          >
            <EyeOff size={14} />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="icon-btn"
          title="Assistant Settings"
          style={{ width: '28px', height: '28px' }}
        >
          <SettingsIcon size={14} />
        </button>

        {/* Floating Window Minimize Control */}
        <button
          onClick={() => {
            fetch('http://127.0.0.1:8000/api/window/hide', { method: 'POST' }).catch(() => {});
          }}
          className="icon-btn"
          title="Minimize Floating Window (Ctrl+\)"
          style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
        >
          <Minus size={14} />
        </button>
      </div>
    </header>
  );
};
