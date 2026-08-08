import { useState, useEffect, useCallback } from 'react';
import type { Message, ModelInfo, Settings } from '../types';

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: '',
  groqApiKey: '',
  backendUrl: DEFAULT_BACKEND_URL,
  defaultModel: 'google/gemma-4-26b-a4b-it:free',
  systemPrompt:
    'You are an elite AI technical coach and problem-solving assistant. CODING PROBLEM & SCREEN ANALYSIS RULES: 1) Whenever a screen capture, LeetCode problem, or coding task is provided, IMMEDIATELY output the COMPLETE, OPTIMAL, PRODUCTION-READY SOLUTION CODE in standard markdown code blocks (e.g. ```python, ```cpp, ```java, ```javascript). 2) Always include Big-O Time Complexity and Space Complexity analysis. 3) Provide a brief 2-3 sentence overview of the algorithmic approach and key edge cases handled.',
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
  backgroundTransparency: 85,
  responseFontSize: 15,

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
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('avai_chat_history_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_SETTINGS.defaultModel);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Persist chat messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('avai_chat_history_v1', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

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

  // Save settings to localStorage and sync backend .env
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('assistant_settings', JSON.stringify(updated));

        // Sync API key updates to backend .env file dynamically
        if (newSettings.openRouterApiKey !== undefined || newSettings.groqApiKey !== undefined) {
          fetch(`${updated.backendUrl || DEFAULT_BACKEND_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              openrouter_api_key: updated.openRouterApiKey,
              groq_api_key: updated.groqApiKey,
            }),
          }).catch(() => {});
        }
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
      if (settings.groqApiKey && settings.groqApiKey.trim().startsWith('gsk_')) {
        headers['x-openrouter-api-key'] = settings.groqApiKey.trim();
      } else if (settings.openRouterApiKey) {
        headers['x-openrouter-api-key'] = settings.openRouterApiKey.trim();
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
