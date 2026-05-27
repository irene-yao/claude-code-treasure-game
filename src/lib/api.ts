const TOKEN_KEY = 'treasure_game_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  signup: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string } }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signin: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string } }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ user: { id: number; email: string } }>('/api/auth/me'),

  saveScore: (score: number) =>
    request<{ ok: boolean }>('/api/scores', {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),

  getScores: () =>
    request<{ scores: { score: number; played_at: string }[] }>('/api/scores'),
};
