export const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = (path: string) => `${API_BASE}${path}`;

export const fileUrl = (path?: string | null) => {
  if (!path) return '';
  // If already absolute (http/https), return as-is
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
};
