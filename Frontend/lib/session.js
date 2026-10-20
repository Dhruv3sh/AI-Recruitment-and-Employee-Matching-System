export const SESSION_KEY = "matchwise-session";

export function isValidSession(session) {
  return Boolean(
    session?.token &&
      session?.user &&
      ["candidate", "recruiter", "admin"].includes(session.user.role),
  );
}

export function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    return isValidSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
