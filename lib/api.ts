export const API_URL = '/api';

export const getAuthToken = () => localStorage.getItem('aatman_token');
export const setAuthToken = (token: string) => localStorage.setItem('aatman_token', token);
export const removeAuthToken = () => localStorage.removeItem('aatman_token');

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      removeAuthToken();
      window.location.href = '/'; // simple redirect
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'An error occurred');
  }

  return response.json();
}

export const api = {
  login: (data: any) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchWithAuth('/auth/me'),
  getConversations: (userId: string) => fetchWithAuth(`/chat/sessions/${userId}`),
  createConversation: (userId: string, title?: string) => fetchWithAuth('/chat/session', { method: 'POST', body: JSON.stringify({ userId, title: title || 'New Session' }) }),
  getMessages: (id: string) => fetchWithAuth(`/memory/${id}`),
  sendMessage: (data: { userId: string, sessionId: string, message: string, engine?: 'llm' | 'brain' }) => fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(data) }),
  getBrainStatus: () => fetchWithAuth('/brain/status'),
  brainThink: (input: string, sessionId?: string) => fetchWithAuth('/brain/think', { method: 'POST', body: JSON.stringify({ input, sessionId }) }),
  brainRunAgents: (goal: string, sessionId?: string) => fetchWithAuth('/brain/agents/run', { method: 'POST', body: JSON.stringify({ goal, sessionId }) }),
  brainAgentFeedback: (data: { goal: string, feedback: string, score?: number, sessionId?: string }) => fetchWithAuth('/brain/agents/feedback', { method: 'POST', body: JSON.stringify(data) }),
  brainIngestText: (name: string, content: string) => fetchWithAuth('/brain/knowledge/text', { method: 'POST', body: JSON.stringify({ name, content }) }),
  executeAction: (data: { action: string, params: Record<string, any> }) => fetchWithAuth('/execute', { method: 'POST', body: JSON.stringify(data) }),
  getMemories: (userId: string) => fetchWithAuth(`/memory/search?userId=${userId}&query=show%20all&limit=50`),
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: formData
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }
};
