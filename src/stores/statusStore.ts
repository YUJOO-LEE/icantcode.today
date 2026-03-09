import { create } from 'zustand';
import type { ApiStatus } from '@/types/api';

interface StatusState {
  apiStatus: ApiStatus;
  statusMessage: string;
  checkedAt: string | null;
  setStatus: (status: { apiStatus: ApiStatus; statusMessage: string; checkedAt: string }) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  apiStatus: 'checking',
  statusMessage: '',
  checkedAt: null,
  setStatus: ({ apiStatus, statusMessage, checkedAt }) =>
    set({ apiStatus, statusMessage, checkedAt }),
}));
