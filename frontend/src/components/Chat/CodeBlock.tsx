import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '12px 0',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: '#0d1117',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          <Code size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={copyCode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'transparent',
            color: copied ? 'var(--accent-emerald)' : 'var(--text-muted)',
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '4px',
            transition: 'var(--transition-fast)',
          }}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre
        style={{
          padding: '14px',
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: '#e6edf3',
          overflowX: 'auto',
          lineHeight: '1.5',
        }}
      >
        <code>{value}</code>
      </pre>
    </div>
  );
};
