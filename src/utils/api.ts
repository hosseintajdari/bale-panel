// Authenticated API utility to prevent 401 Unauthorized across all secured routes

let cachedToken: string | null = null;

export async function getOperatorToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  try {
    const res = await fetch('/api/auth/token');
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        cachedToken = data.token;
        return cachedToken as string;
      }
    }
  } catch (err) {
    console.debug('Failed to fetch auth token:', err);
  }
  return '';
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getOperatorToken();
  const headers = new Headers(init?.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
