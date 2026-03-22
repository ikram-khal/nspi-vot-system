// Session management for PIN-based auth
const SESSION_KEY = 'nspi_session_id';
const MEMBER_KEY = 'nspi_member';
const ADMIN_KEY = 'nspi_admin';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function setMember(member: { id: string; name: string; pin: string }) {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function getMember(): { id: string; name: string; pin: string } | null {
  const raw = localStorage.getItem(MEMBER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearMember() {
  localStorage.removeItem(MEMBER_KEY);
}

export function setAdmin(isAdmin: boolean) {
  if (isAdmin) localStorage.setItem(ADMIN_KEY, 'true');
  else localStorage.removeItem(ADMIN_KEY);
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function clearAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

// Hardcoded admin password
export const ADMIN_PASSWORD = 'nspi2024admin';
