import { create } from 'zustand';
import type { ApiStatus, ModelStatus } from '@/types/api';

interface StatusState {
  apiStatus: ApiStatus;
  statusMessage: string;
  checkedAt: string | null;
  models: ModelStatus[];
  setStatus: (status: { apiStatus: ApiStatus; statusMessage: string; checkedAt: string; models: ModelStatus[] }) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  apiStatus: 'checking',
  statusMessage: '',
  checkedAt: null,
  models: [],
  setStatus: ({ apiStatus, statusMessage, checkedAt, models }) =>
    set({ apiStatus, statusMessage, checkedAt, models }),
}));
