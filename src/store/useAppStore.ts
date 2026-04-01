import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';

interface AppStore {
  theme: Theme;
  ollamaChatUrl: string;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setOllamaUrl: (url: string) => void;
  resetOllamaUrl: () => void;
  loadPersistedState: () => Promise<void>;
}

const DEFAULT_OLLAMA_URL = 'http://172.16.20.19:11434/api/chat';

export const useAppStore = create<AppStore>((set, get) => ({
  theme: 'dark',
  ollamaChatUrl: DEFAULT_OLLAMA_URL,

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('app_theme', theme);
  },

  toggleTheme: () => {
    const newTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    AsyncStorage.setItem('app_theme', newTheme);
  },

  setOllamaUrl: (url) => {
    set({ ollamaChatUrl: url });
    AsyncStorage.setItem('ollama_chat_url', url);
  },

  resetOllamaUrl: () => {
    set({ ollamaChatUrl: DEFAULT_OLLAMA_URL });
    AsyncStorage.setItem('ollama_chat_url', DEFAULT_OLLAMA_URL);
  },

  loadPersistedState: async () => {
    const [theme, ollamaUrl] = await Promise.all([
      AsyncStorage.getItem('app_theme'),
      AsyncStorage.getItem('ollama_chat_url'),
    ]);
    const updates: Partial<AppStore> = {};
    if (theme === 'dark' || theme === 'light') updates.theme = theme;
    if (ollamaUrl) updates.ollamaChatUrl = ollamaUrl;
    set(updates);
  },
}));
