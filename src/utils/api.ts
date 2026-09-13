export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'same-origin',
  });
}

export const telegramApi = {
  getKeyboards: () => authFetch('/api/admin/telegram/keyboards').then(res => res.json()),
  saveKeyboard: (data: { id?: string; name: string; schemaJson: string }) => authFetch('/api/admin/telegram/keyboards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteKeyboard: (id: string) => authFetch(`/api/admin/telegram/keyboards/${id}`, { method: 'DELETE' }).then(res => res.json()),
  getWebApps: () => authFetch('/api/admin/telegram/webapps').then(res => res.json()),
  saveWebApp: (data: { id?: string; name: string; url: string; configJson?: string }) => authFetch('/api/admin/telegram/webapps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteWebApp: (id: string) => authFetch(`/api/admin/telegram/webapps/${id}`, { method: 'DELETE' }).then(res => res.json()),
};
