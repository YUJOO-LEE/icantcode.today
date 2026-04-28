import { create } from 'zustand';
import type { ApiStatus, ModelStatus, StatusPage } from '@/types/api';

interface StatusState {
  apiStatus: ApiStatus;
  statusMessage: string;
  checkedAt: string | null;
  models: ModelStatus[];
  statusPage: StatusPage | null;
  setStatus: (status: {
    apiStatus: ApiStatus;
    statusMessage: string;
    checkedAt: string;
    models: ModelStatus[];
    statusPage: StatusPage | null;
  }) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  apiStatus: 'checking',
  statusMessage: '',
  checkedAt: null,
  models: [],
  statusPage: null,
  setStatus: ({ apiStatus, statusMessage, checkedAt, models, statusPage }) =>
    set({ apiStatus, statusMessage, checkedAt, models, statusPage }),
}));
