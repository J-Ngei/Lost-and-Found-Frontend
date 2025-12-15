// Get the base URL from environment variable
const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = (path: string) => {
  // Remove leading/trailing slashes from path and base URL
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // If no base URL is set, just return the path with leading slash
  if (!cleanBase) return `/${cleanPath}`;
  
  // If path already starts with http, return as is (absolute URL)
  if (/^https?:\/\//i.test(path)) return path;
  
  // If path already starts with the base URL, return as is
  if (path.startsWith(cleanBase)) return path;
  
  // Otherwise, combine base URL and path with a single slash
  return `${cleanBase}/${cleanPath}`;
};

export const fileUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  
  // Remove leading slashes from path to prevent double slashes
  const cleanPath = path.replace(/^\/+/, '');
  
  // If API_BASE is empty, just return the path
  if (!API_BASE) return `/${cleanPath}`;
  
  // Otherwise, combine them with a single slash
  return `${API_BASE}/${cleanPath}`;
};

// Helper function for making JSON requests
export const jsonRequest = async <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  headers: Record<string, string> = {}
): Promise<T> => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(api(url), config);
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    throw new Error(errorData.error || 'An error occurred');
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return null as any;
  }

  return response.json();
};

// Helper function for form data requests
export const formDataRequest = async <T = any>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  formData: FormData,
  headers: Record<string, string> = {}
): Promise<T> => {
  const response = await fetch(api(url), {
    method,
    headers: {
      ...headers,
      // Don't set Content-Type header, let the browser set it with the correct boundary
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    throw new Error(errorData.error || 'An error occurred');
  }

  return response.json();
};
