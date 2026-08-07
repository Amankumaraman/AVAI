import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';
import { CodeBlock } from './CodeBlock';
import { Bot, User, Volume2, Copy, Check, Trash2, Eye } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onSpeak?: (text: string) => void;
  onDelete?: (id: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSpeak,
  onDelete,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px 20px',
        background: isUser ? 'rgba(255, 255, 255, 0.02)' : 'rgba(18, 24, 38, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        transition: 'var(--transition-normal)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: isUser
            ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
            : 'linear-gradient(135deg, #06b6d4, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          boxShadow: isUser
            ? '0 0 12px rgba(59, 130, 246, 0.3)'
            : '0 0 12px rgba(6, 182, 212, 0.3)',
        }}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Message Content Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header (Role, Model Badge, Actions) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              {isUser ? 'You' : 'Multimodal AI'}
            </span>
            {!isUser && message.model && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 600,
                }}
              >
                {message.model.replace(':free', '')}
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!isUser && onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                title="Speak AI response"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
              >
                <Volume2 size={14} />
              </button>
            )}
            <button
              onClick={handleCopy}
              title="Copy text"
              className="icon-btn"
              style={{ width: '28px', height: '28px' }}
            >
              {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                title="Delete message"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Vision Image Attachment Thumbnail */}
        {message.imageData && (
          <div
            style={{
              margin: '8px 0 12px 0',
              position: 'relative',
              display: 'inline-block',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-glass)',
              maxHeight: '220px',
              maxWidth: '320px',
            }}
          >
            <img
              src={message.imageData}
              alt="Uploaded visual context"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                background: 'rgba(0, 0, 0, 0.65)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Eye size={12} /> Visual Input
            </div>
          </div>
        )}

        {/* Message Markdown Text */}
        <div
          className="markdown-body"
          style={{
            color: message.isError ? '#f87171' : 'var(--text-main)',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
