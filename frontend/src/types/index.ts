export interface MessageContentText {
  type: 'text';
  text: string;
}

export interface MessageContentImage {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export type ChatMessageContent = string | (MessageContentText | MessageContentImage)[];

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageData?: string; // base64 data url for attached image
  timestamp: number;
  model?: string;
  isError?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  supports_vision: boolean;
  context_length: number;
  is_free: boolean;
}

export type ProfileType = 'interview' | 'sales' | 'meeting' | 'presentation' | 'negotiation' | 'exam';
export type AnswerMode = 'verbal' | 'code';
export type TechRole = 'backend' | 'frontend' | 'data' | 'devops' | 'general';

export interface KeyboardShortcuts {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  toggleVisibility: string;
  toggleClickThrough: string;
  askNextStep: string;
  prevResponse: string;
  nextResponse: string;
  scrollUp: string;
  scrollDown: string;
}

export interface Settings {
  openRouterApiKey: string;
  backendUrl: string;
  defaultModel: string;
  systemPrompt: string;
  autoSpeakResponse: boolean;
  continuousListening: boolean;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  
  // Profile & Mode Selection
  selectedProfile: ProfileType;
  answerMode: AnswerMode;
  techRole: TechRole;
  autoCaptureInterval: number; // 0 = off, 5 = 5s, 10 = 10s

  // Audio Input & Image Quality
  audioMode: 'speaker_only' | 'mic_only' | 'both';
  imageQuality: 'low' | 'medium' | 'high';
  
  // Language
  speechLanguage: string;
  
  // Appearance
  theme: 'dark' | 'light' | 'glass';
  backgroundTransparency: number; // 0 to 100
  responseFontSize: number; // e.g. 18 (px)
  
  // Keyboard Shortcuts
  shortcuts: KeyboardShortcuts;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'vision' | 'general' | 'creative' | 'study';
  prompt: string;
  icon: string;
}
