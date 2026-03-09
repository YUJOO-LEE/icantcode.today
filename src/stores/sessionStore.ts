import { create } from 'zustand';

interface SessionState {
  userCode: string;
  nickname: string | null;
  setNickname: (nickname: string) => void;
  hasNickname: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  userCode: crypto.randomUUID(),
  nickname: null,
  setNickname: (nickname: string) => set({ nickname }),
  hasNickname: () => get().nickname !== null,
}));
