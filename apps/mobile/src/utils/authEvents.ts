// =====================================================
// Auth Event Bus
// Allows API client to signal session expiry to AuthContext
// without creating a circular dependency.
// =====================================================

type SessionExpiredListener = () => void;

const listeners: Set<SessionExpiredListener> = new Set();

export function onSessionExpired(callback: SessionExpiredListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function emitSessionExpired(): void {
  listeners.forEach((cb) => cb());
}
