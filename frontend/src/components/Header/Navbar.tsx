import React from 'react';
import { Bot } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  return (
    <header
      className="navbar pywebview-drag-region"
      style={{
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      <div className="nav-brand" style={{ gap: '10px', alignItems: 'center', display: 'flex' }}>
        {/* Apple macOS Traffic Control Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
          {/* Red Dot -> Exit App */}
          <button
            type="button"
            onClick={() => {
              fetch('http://127.0.0.1:8000/api/window/close', { method: 'POST' }).catch(() => {
                window.close();
              });
            }}
            style={{
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: '#ff5f56',
              border: '1px solid rgba(255, 95, 86, 0.5)',
              cursor: 'pointer',
              boxShadow: '0 0 6px rgba(255, 95, 86, 0.6)',
              padding: 0,
            }}
            title="Exit App (Close Process)"
          />
          {/* Yellow Dot -> Open Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: '#ffbd2e',
              border: '1px solid rgba(255, 189, 46, 0.5)',
              cursor: 'pointer',
              boxShadow: '0 0 6px rgba(255, 189, 46, 0.6)',
              padding: 0,
            }}
            title="Open Settings & Preferences"
          />
        </div>

        <div
          className="brand-icon"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Bot size={14} />
        </div>
        <span className="brand-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
          AVAI
        </span>
      </div>
    </header>
  );
};
