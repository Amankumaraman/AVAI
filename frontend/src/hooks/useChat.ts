import { useState, useEffect, useCallback } from 'react';
import type { Message, ModelInfo, Settings } from '../types';

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: '',
  backendUrl: DEFAULT_BACKEND_URL,
  defaultModel: 'openrouter/free',
  systemPrompt:
    'You are an elite technical interview coach providing real-time interview answers. STRICT RULES: 1) Provide sharp, concise bullet-point answers ("pointers") ready to speak in an interview. 2) Structure answers into: TL;DR Summary (1 sentence), Key Interview Pointers (3-4 bullet points), and Key Trade-off / When to Use (1 sentence). 3) ABSOLUTELY NO CODE BLOCKS OR TRIPLE BACKTICKS (` ``` `). Code snippets are STRICTLY FORBIDDEN unless explicitly asked to write code or an image/screen capture is provided.',
  autoSpeakResponse: false,
  continuousListening: false,
  voiceName: '',
  speechRate: 1.0,
  speechPitch: 1.0,

  selectedProfile: 'interview',
  answerMode: 'verbal',
  techRole: 'backend',
  autoCaptureInterval: 0,

  audioMode: 'speaker_only',
  imageQuality: 'medium',

  speechLanguage: 'en-US',

  theme: 'dark',
  backgroundTransparency: 35,
  responseFontSize: 18,

  shortcuts: {
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
  },
};

export function useChat(onSpeakResponse?: (text: string) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_SETTINGS.defaultModel);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Settings persisted in localStorage
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('assistant_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.systemPrompt || parsed.systemPrompt.includes('Code Example')) {
          parsed.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse saved settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('assistant_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  const restoreAllSettings = useCallback(() => {
    try {
      localStorage.removeItem('assistant_settings');
    } catch (e) {
      console.error('Failed to clear settings:', e);
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const deleteAllData = useCallback(() => {
    setMessages([]);
    setAttachedImage(null);
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Fetch models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch(`${settings.backendUrl}/api/models`);
        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (err) {
        console.warn('Failed to fetch models from backend:', err);
      }
    }
    fetchModels();
  }, [settings.backendUrl]);

  // Main Send Message handler
  const sendMessage = useCallback(
    async (prompt: string, overrideImage?: string) => {
      const imageToUse = overrideImage || attachedImage;
      if (!prompt.trim() && !imageToUse) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt || 'Analyze this attached image.',
        imageData: imageToUse || undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setAttachedImage(null);
      setIsLoading(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (settings.openRouterApiKey) {
        headers['x-openrouter-api-key'] = settings.openRouterApiKey;
      }

      try {
        let endpoint = `${settings.backendUrl}/api/chat`;
        let payload: any;

        if (imageToUse) {
          endpoint = `${settings.backendUrl}/api/vision`;
          payload = {
            model: selectedModel,
            prompt: prompt || 'Analyze this image in detail.',
            image_data: imageToUse,
            system_prompt: settings.systemPrompt,
            answer_mode: settings.answerMode,
            tech_role: settings.techRole,
          };
        } else {
          // Prepare last 10 messages for context
          const historyContext = messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          }));
          historyContext.push({ role: 'user', content: prompt });

          payload = {
            model: selectedModel,
            messages: historyContext,
            system_prompt: settings.systemPrompt,
            answer_mode: settings.answerMode,
            tech_role: settings.techRole,
            stream: false,
          };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errData.detail || 'Failed to get response from AI assistant');
        }

        const data = await res.json();
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          model: data.model || selectedModel,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-speak if enabled
        if (settings.autoSpeakResponse && onSpeakResponse) {
          onSpeakResponse(data.content);
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Could not connect to assistant backend. Check if FastAPI server is running on port 8000 and your OpenRouter API Key in Settings.'}`,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      selectedModel,
      attachedImage,
      settings.backendUrl,
      settings.openRouterApiKey,
      settings.systemPrompt,
      settings.answerMode,
      settings.techRole,
      settings.autoSpeakResponse,
      onSpeakResponse,
    ]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
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
  };
}
