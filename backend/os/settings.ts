import bcrypt from 'bcryptjs';

export type SettingKey = 'theme' | 'notifications' | 'language' | 'privacy' | 'pin';

export interface UserSetting {
  userId: string;
  key: SettingKey;
  value: string;
}

// Example: In-memory settings store (replace with DB in production)
const settingsStore: UserSetting[] = [];

export function setUserSetting(userId: string, key: SettingKey, value: string) {
  const existing = settingsStore.find(s => s.userId === userId && s.key === key);
  if (existing) {
    existing.value = value;
  } else {
    settingsStore.push({ userId, key, value });
  }
}

export function getUserSetting(userId: string, key: SettingKey): string | undefined {
  return settingsStore.find(s => s.userId === userId && s.key === key)?.value;
}

export function getAllUserSettings(userId: string): UserSetting[] {
  return settingsStore.filter(s => s.userId === userId);
}

export async function setUserPin(userId: string, pin: string) {
  const hash = await bcrypt.hash(pin, 10);
  setUserSetting(userId, 'pin', hash);
}

export function getUserPinHash(userId: string): string | undefined {
  return getUserSetting(userId, 'pin');
}

export async function verifyUserPin(userId: string, pin: string): Promise<boolean> {
  const hash = getUserPinHash(userId);
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}