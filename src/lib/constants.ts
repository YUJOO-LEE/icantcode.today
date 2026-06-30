export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '') as string;
/**
 * VAPID public key used to subscribe the browser to Web Push. Supplied by the
 * push backend; when empty the notification opt-in is hidden, so the feature
 * stays dormant until the backend is configured.
 */
export const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '') as string;
export const POLLING_INTERVAL = 30_000;
export const POSTS_PAGE_SIZE = 10;
export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
export const MAX_NICKNAME_LENGTH = 20;
