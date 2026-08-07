import React from 'react';
import { MessageItem } from './MessageItem';
import type { Message, ProfileType } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedProfile?: ProfileType;
  activePageIndex: number;
  onPageChange: (newIndex: number) => void;
}

const PROFILE_NAMES: Record<ProfileType, string> = {
  interview: 'Job Interview',
  sales: 'Sales Call',
  meeting: 'Business Meeting',
  presentation: 'Presentation',
  negotiation: 'Negotiation',
  exam: 'Exam Assistant',
};

export interface ResponsePage {
  pageNumber: number;
  userMessage?: Message;
  assistantMessage: Message;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSpeak,
  onDeleteMessage,
  selectedProfile = 'interview',
  activePageIndex,
  onPageChange,
}) => {
  // Group messages into QA Response Pages
  const pages: ResponsePage[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant') {
      const assistantMsg = messages[i];
      const userMsg = i > 0 && messages[i - 1].role === 'user' ? messages[i - 1] : undefined;
      pages.push({
        pageNumber: pages.length + 1,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    }
  }

  const totalPages = pages.length;
  // Ensure safe active index bounds
  const safePageIndex = Math.max(0, Math.min(activePageIndex, totalPages - 1));
  const activePage = totalPages > 0 ? pages[safePageIndex] : null;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {totalPages === 0 ? (
        /* Empty Session Placeholder */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          Listening to your {PROFILE_NAMES[selectedProfile] || 'session'}...
        </div>
      ) : (
        /* Single Response Page Display View */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {activePage && (
            <div>
              {/* Optional Question Context Banner */}
              {activePage.userMessage && (
                <div
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <strong style={{ color: 'var(--accent-cyan)' }}>Q:</strong>
                  <span style={{ color: '#fff', fontStyle: 'italic' }}>
                    {activePage.userMessage.content || 'Screen Analysis Context'}
                  </span>
                </div>
              )}

              {/* Main AI Response Page */}
              <MessageItem
                key={activePage.assistantMessage.id}
                message={activePage.assistantMessage}
                onSpeak={onSpeak}
                onDelete={onDeleteMessage}
              />
            </div>
          )}

          {/* Loading Processing Spinner */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid var(--primary)',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>Analyzing screen & transcript...</span>
            </div>
          )}
        </div>
      )}

      {/* Page Navigation Counter Strip (< Page 1 of 5 >) */}
      {totalPages > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderTop: '1px solid var(--border-glass)',
            background: 'var(--bg-input)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <button
            onClick={() => onPageChange(Math.max(0, safePageIndex - 1))}
            disabled={safePageIndex <= 0}
            className="icon-btn"
            style={{ width: '26px', height: '26px', padding: 0 }}
            title="Previous Page (Ctrl+[)"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pages.map((p, idx) => (
              <button
                key={p.assistantMessage.id}
                onClick={() => onPageChange(idx)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: idx === safePageIndex ? 'var(--primary)' : 'transparent',
                  color: idx === safePageIndex ? '#fff' : 'var(--text-muted)',
                  border: idx === safePageIndex ? '1px solid var(--primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: idx === safePageIndex ? 700 : 400,
                  transition: 'var(--transition-fast)',
                }}
                title={`Jump to Page ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, safePageIndex + 1))}
            disabled={safePageIndex >= totalPages - 1}
            className="icon-btn"
            style={{ width: '26px', height: '26px', padding: 0 }}
            title="Next Page (Ctrl+])"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
