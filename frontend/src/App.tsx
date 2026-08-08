import { useState, useCallback, useEffect, useRef } from 'react';
import { Navbar } from './components/Header/Navbar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { MessageInput } from './components/Chat/MessageInput';
import { AudioVisualizer } from './components/Voice/AudioVisualizer';
import { SettingsModal } from './components/Settings/SettingsModal';
import { CameraModal } from './components/Vision/CameraModal';
import { PromptModal } from './components/PromptTemplates/PromptModal';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useChat } from './hooks/useChat';
import { useShortcuts } from './hooks/useShortcuts';
import type { ProfileType, AnswerMode, TechRole } from './types';
import './App.css';

export function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);

  // Stealth & Window Visibility Controls
  const [isVisible, setIsVisible] = useState(true);
  const [isClickThrough, setIsClickThrough] = useState(false);

  // Single Page per Response Pagination state
  const [activePageIndex, setActivePageIndex] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const toggleVisibility = () => {
    fetch(`${settings.backendUrl || 'http://127.0.0.1:8000'}/api/window/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'error') {
          setIsVisible((prev) => !prev);
        }
      })
      .catch(() => {
        setIsVisible((prev) => !prev);
      });
  };

  // 1. Web Speech Synthesis TTS Hook
  const { isSpeaking, voices, speak, stop: stopSpeaking } = useSpeechSynthesis();

  const handleSpeakResponse = useCallback(
    (_text: string) => {
      // Audio response is permanently muted to prevent interviewers from hearing any sound
      return;
    },
    []
  );

  // 2. Chat & Backend State Hook
  const {
    messages,
    isLoading,
    models,
    selectedModel,
    setSelectedModel,
    attachedImage,
    setAttachedImage,
    settings,
    updateSettings,
    restoreAllSettings,
    deleteAllData,
    sendMessage,
    clearHistory,
    removeMessage,
  } = useChat(handleSpeakResponse);

  // Helper to move the physical OUTER OS PyWebView Desktop Window
  const moveNativeWindowOS = (dx: number, dy: number) => {
    fetch(`${settings.backendUrl}/api/window/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx, dy }),
    }).catch((err) => console.warn('Native window move error:', err));
  };

  const assistantCount = messages.filter((m) => m.role === 'assistant').length;

  // Auto-jump to latest response page when new response arrives
  useEffect(() => {
    if (assistantCount > 0) {
      setActivePageIndex(assistantCount - 1);
    }
  }, [assistantCount]);

  // Dynamic CSS variables for Transparency and Response Font Size
  // Also applies native OS window transparency via Win32 SetLayeredWindowAttributes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.backgroundTransparency !== undefined) {
      const alpha = (settings.backgroundTransparency / 100).toFixed(2);
      root.style.setProperty('--bg-card', `rgba(18, 24, 38, ${alpha})`);
      root.style.setProperty('--body-bg', `rgba(9, 13, 22, ${alpha})`);

      // Also set native OS window transparency (outer frame + chrome)
      fetch(`${settings.backendUrl || 'http://127.0.0.1:8000'}/api/window/opacity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opacity: settings.backgroundTransparency }),
      }).catch(() => {});
    }
    if (settings.responseFontSize !== undefined) {
      root.style.setProperty('--response-font-size', `${settings.responseFontSize}px`);
    }
  }, [settings.backgroundTransparency, settings.responseFontSize, settings.backendUrl]);

  // Fix WebView2 white screen after minimize/restore
  // When the page becomes visible again, nudge the DOM to force Chromium's compositor to repaint
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Force a compositor repaint by toggling a CSS transform
        const root = document.documentElement;
        root.style.transform = 'translateZ(0)';
        requestAnimationFrame(() => {
          root.style.transform = '';
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 3. Web Speech Recognition STT Hook
  const handleTranscriptFinalized = useCallback(
    (finalText: string) => {
      if (finalText.trim()) {
        sendMessage(finalText);
      }
    },
    [sendMessage]
  );

  const {
    isListening,
    fullTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscriptFinalized: handleTranscriptFinalized,
    continuous: settings.continuousListening,
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 4. Hook for All Keyboard Controls matching Cheating Daddy shortcuts + Emergency Boss Key (Esc)
  useShortcuts({
    onMoveUp: () => moveNativeWindowOS(0, -40),
    onMoveDown: () => moveNativeWindowOS(0, 40),
    onMoveLeft: () => moveNativeWindowOS(-40, 0),
    onMoveRight: () => moveNativeWindowOS(40, 0),
    onToggleVisibility: toggleVisibility,
    onToggleClickThrough: () => setIsClickThrough((prev) => !prev),
    onAskNextStep: () => sendMessage('What is the next step or code implementation?'),
    onPrevResponse: () => {
      setActivePageIndex((prev) => Math.max(0, prev - 1));
    },
    onNextResponse: () => {
      setActivePageIndex((prev) => Math.min(assistantCount - 1, prev + 1));
    },
    onScrollUp: () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollBy({ top: -300, behavior: 'smooth' });
      }
    },
    onScrollDown: () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollBy({ top: 300, behavior: 'smooth' });
      }
    },
  });

  // Emergency Escape key listener (Boss Key)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleVisibility();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="app-container"
      style={{
        pointerEvents: isClickThrough ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Cheating Daddy Style Navbar Header with Native Window Dragging */}
      <Navbar
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedProfile={settings.selectedProfile || 'interview'}
        onSelectProfile={(profile: ProfileType) => updateSettings({ selectedProfile: profile })}
        answerMode={settings.answerMode || 'verbal'}
        onToggleAnswerMode={(mode: AnswerMode) => updateSettings({ answerMode: mode })}
        techRole={settings.techRole || 'backend'}
        onSelectTechRole={(role: TechRole) => updateSettings({ techRole: role })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrompts={() => setIsPromptsOpen(true)}
        onClearHistory={clearHistory}
        messages={messages}
        isStealthMode={!isVisible}
        onToggleStealthMode={toggleVisibility}
      />

      {/* Main Workspace Workspace */}
      <main className="main-workspace">
        <section className="chat-section">
          {/* Single Page Display View with Page Pagination */}
          <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSpeak={speak}
              onDeleteMessage={removeMessage}
              selectedProfile={settings.selectedProfile || 'interview'}
              activePageIndex={activePageIndex}
              onPageChange={(idx) => setActivePageIndex(idx)}
            />
          </div>

          {/* Dynamic Audio Visualizer Banner (Listening / Speaking) */}
          <AudioVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
          />

          {/* Cheating Daddy Style Message Input Bar with 'Analyze Screen' Button */}
          <MessageInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
            isListening={isListening}
            onToggleListening={toggleListening}
            attachedImage={attachedImage}
            onSetAttachedImage={setAttachedImage}
            onOpenCamera={() => setIsCameraOpen(true)}
            autoSpeak={settings.autoSpeakResponse}
            onToggleAutoSpeak={() =>
              updateSettings({ autoSpeakResponse: !settings.autoSpeakResponse })
            }
            liveTranscript={fullTranscript}
          />
        </section>
      </main>

      {/* Modals & Overlays */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onRestoreAllSettings={restoreAllSettings}
        onDeleteAllData={deleteAllData}
        voices={voices}
      />

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(base64Img) => setAttachedImage(base64Img)}
      />

      <PromptModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        onSelectPrompt={(prompt) => sendMessage(prompt)}
      />
    </div>
  );
}

export default App;
