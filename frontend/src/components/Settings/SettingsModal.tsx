import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import type { Settings, KeyboardShortcuts } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Partial<Settings>) => void;
  onRestoreAllSettings?: () => void;
  onDeleteAllData?: () => void;
  voices?: SpeechSynthesisVoice[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onRestoreAllSettings,
  onDeleteAllData,
}) => {
  const [apiKey, setApiKey] = useState(settings.openRouterApiKey);
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeakResponse);
  const [voiceName, setVoiceName] = useState(settings.voiceName);
  const [speechRate, setSpeechRate] = useState(settings.speechRate);

  const [audioMode, setAudioMode] = useState(settings.audioMode || 'speaker_only');
  const [imageQuality, setImageQuality] = useState(settings.imageQuality || 'medium');
  const [speechLanguage, setSpeechLanguage] = useState(settings.speechLanguage || 'en-US');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [backgroundTransparency, setBackgroundTransparency] = useState(settings.backgroundTransparency ?? 85);
  const [responseFontSize, setResponseFontSize] = useState(settings.responseFontSize ?? 15);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>(settings.shortcuts || {
    moveUp: 'Ctrl+Up',
    moveDown: 'Ctrl+Down',
    moveLeft: 'Ctrl+Left',
    moveRight: 'Ctrl+Right',
    toggleVisibility: 'Ctrl+\\',
    toggleClickThrough: 'Ctrl+M',
    askNextStep: 'Ctrl+Enter',
    prevResponse: 'Ctrl+[',
    nextResponse: 'Ctrl+]',
    scrollUp: 'Ctrl+Shift+Up',
    scrollDown: 'Ctrl+Shift+Down',
  });

  useEffect(() => {
    setApiKey(settings.openRouterApiKey);
    setBackendUrl(settings.backendUrl);
    setSystemPrompt(settings.systemPrompt);
    setAutoSpeak(settings.autoSpeakResponse);
    setVoiceName(settings.voiceName);
    setSpeechRate(settings.speechRate);
    setAudioMode(settings.audioMode || 'speaker_only');
    setImageQuality(settings.imageQuality || 'medium');
    setSpeechLanguage(settings.speechLanguage || 'en-US');
    setTheme(settings.theme || 'dark');
    setBackgroundTransparency(settings.backgroundTransparency ?? 83);
    setResponseFontSize(settings.responseFontSize ?? 18);
    if (settings.shortcuts) setShortcuts(settings.shortcuts);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({
      openRouterApiKey: apiKey,
      backendUrl,
      systemPrompt,
      autoSpeakResponse: autoSpeak,
      voiceName,
      speechRate,
      audioMode,
      imageQuality,
      speechLanguage,
      theme,
      backgroundTransparency,
      responseFontSize,
      shortcuts,
    });
    onClose();
  };

  const handleResetShortcuts = () => {
    setShortcuts({
      moveUp: 'Ctrl+Up',
      moveDown: 'Ctrl+Down',
      moveLeft: 'Ctrl+Left',
      moveRight: 'Ctrl+Right',
      toggleVisibility: 'Ctrl+\\',
      toggleClickThrough: 'Ctrl+M',
      askNextStep: 'Ctrl+Enter',
      prevResponse: 'Ctrl+[',
      nextResponse: 'Ctrl+]',
      scrollUp: 'Ctrl+Shift+Up',
      scrollDown: 'Ctrl+Shift+Down',
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '88vh',
          background: '#0d121f',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          color: '#e5e7eb',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Settings</h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Audio Input */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              Audio Input
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Audio Mode</span>
                <select
                  value={audioMode}
                  onChange={(e: any) => setAudioMode(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#161d2f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    minWidth: '220px',
                  }}
                >
                  <option value="speaker_only">Speaker Only (Interviewer)</option>
                  <option value="mic_only">Microphone Only</option>
                  <option value="both">Both (Speaker + Mic)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Image Quality</span>
                <select
                  value={imageQuality}
                  onChange={(e: any) => setImageQuality(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#161d2f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    minWidth: '220px',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium Quality</option>
                  <option value="high">High Quality</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Language */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              Language
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Speech Language</span>
              <select
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#161d2f',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  minWidth: '220px',
                }}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
          </div>

          {/* Section 3: Appearance */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              Appearance
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Theme Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Theme</span>
                <select
                  value={theme}
                  onChange={(e: any) => setTheme(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#161d2f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    minWidth: '220px',
                  }}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="glass">Glassmorphic Cyber</option>
                </select>
              </div>

              {/* Background Transparency Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Window Opacity</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {backgroundTransparency}%
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6, marginBottom: '6px' }}>
                  Controls both inner content and outer window frame
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={backgroundTransparency}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBackgroundTransparency(val);
                    onSave({ backgroundTransparency: val });
                  }}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Response Font Size Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Response Font Size</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {responseFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="28"
                  value={responseFontSize}
                  onChange={(e) => setResponseFontSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Keyboard Shortcuts */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              Keyboard Shortcuts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Move Window Up', key: 'moveUp', val: shortcuts.moveUp },
                { label: 'Move Window Down', key: 'moveDown', val: shortcuts.moveDown },
                { label: 'Move Window Left', key: 'moveLeft', val: shortcuts.moveLeft },
                { label: 'Move Window Right', key: 'moveRight', val: shortcuts.moveRight },
                { label: 'Toggle Visibility', key: 'toggleVisibility', val: shortcuts.toggleVisibility },
                { label: 'Toggle Click-through', key: 'toggleClickThrough', val: shortcuts.toggleClickThrough },
                { label: 'Ask Next Step', key: 'askNextStep', val: shortcuts.askNextStep },
                { label: 'Previous Response', key: 'prevResponse', val: shortcuts.prevResponse },
                { label: 'Next Response', key: 'nextResponse', val: shortcuts.nextResponse },
                { label: 'Scroll Response Up', key: 'scrollUp', val: shortcuts.scrollUp },
                { label: 'Scroll Response Down', key: 'scrollDown', val: shortcuts.scrollDown },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.label}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      background: '#161d2f',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {item.val}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleResetShortcuts}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: API & System Persona Config */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>API & Voice Settings</h3>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                OpenRouter API Key (Optional Override)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#161d2f',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Section 6: Privacy and Data */}
          <div
            style={{
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '18px 20px',
              background: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>
              Privacy and Data
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onRestoreAllSettings) onRestoreAllSettings();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Restore all settings
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAllData) onDeleteAllData();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Delete all data
              </button>
            </div>
          </div>

          {/* Save Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-neon)',
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
