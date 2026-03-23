// API client – gọi qua Express server (server.js)
// Dev: Vite proxy /api → localhost:3001
// Production: Express serve cả frontend lẫn API

export const isConfigured = true

async function api(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

/** Lấy tất cả sessions */
export async function getAllSessions() {
  return api('GET', '/sessions')
}

/** Lưu một session mới */
export async function insertSession(session) {
  return api('POST', '/sessions', session)
}

/** Xoá một session theo id */
export async function removeSession(id) {
  return api('DELETE', `/sessions/${id}`)
}

/** Bulk insert (dùng khi import JSON) */
export async function importSessions(sessions) {
  if (!sessions.length) return
  return api('POST', '/sessions/bulk', sessions)
}
