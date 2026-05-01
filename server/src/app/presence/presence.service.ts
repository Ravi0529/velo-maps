const activeUsers = new Map<string, string>();

export function addActiveUser(userId: string, socketId: string) {
  activeUsers.set(userId, socketId);
}

export function removeActiveUser(userId: string) {
  activeUsers.delete(userId);
}

export function isUserActive(userId: string) {
  return activeUsers.has(userId);
}

export function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

const lastLocations = new Map<string, { lat: number; lng: number }>();

export function shouldProcessLocation(
  userId: string,
  lat: number,
  lng: number,
) {
  const prev = lastLocations.get(userId);

  if (!prev) {
    lastLocations.set(userId, { lat, lng });
    return true;
  }

  if (prev.lat === lat && prev.lng === lng) {
    return false;
  }

  lastLocations.set(userId, { lat, lng });
  return true;
}

const lastSentTime = new Map<string, number>();

export function canSendLocation(userId: string) {
  const now = Date.now();
  const last = lastSentTime.get(userId);

  if (!last || now - last > 5000) {
    lastSentTime.set(userId, now);
    return true;
  }

  return false;
}

export const lastHeartbeat = new Map<string, number>();

export function updateHeartbeat(userId: string) {
  lastHeartbeat.set(userId, Date.now());
}
