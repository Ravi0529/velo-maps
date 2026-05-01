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
