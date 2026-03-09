import { create } from 'zustand';
import { generateUUID } from '@/lib/utils';

interface SessionState {
  userCode: string;
  nickname: string | null;
  setNickname: (nickname: string) => void;
  hasNickname: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  userCode: generateUUID(),
  nickname: null,
  setNickname: (nickname: string) => set({ nickname }),
  hasNickname: () => get().nickname !== null,
}));
