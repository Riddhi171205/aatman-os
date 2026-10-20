import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import settingsRouter from './settings';

// Mock dependencies
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'user123' }; // Mock authenticated user
    next();
  }
}));

vi.mock('../os/settings', () => ({
  setUserSetting: vi.fn(),
  getUserSetting: vi.fn(),
  getAllUserSettings: vi.fn(),
  setUserPin: vi.fn(),
  verifyUserPin: vi.fn()
}));

import {
  setUserSetting,
  getUserSetting,
  getAllUserSettings,
  setUserPin,
  verifyUserPin
} from '../os/settings';

const app = express();
app.use(express.json());
app.use('/api/settings', settingsRouter);

describe('Settings Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return all user settings', async () => {
      const mockSettings = { theme: 'dark', notifications: true };
      vi.mocked(getAllUserSettings).mockReturnValue(mockSettings as any);

      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
      expect(getAllUserSettings).toHaveBeenCalledWith('user123');
    });
  });

  describe('GET /api/settings/:key', () => {
    it('should return a specific user setting', async () => {
      vi.mocked(getUserSetting).mockReturnValue('dark' as any);

      const response = await request(app).get('/api/settings/theme');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ value: 'dark' });
      expect(getUserSetting).toHaveBeenCalledWith('user123', 'theme');
    });
  });

  describe('POST /api/settings', () => {
    it('should set a user setting', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({ key: 'theme', value: 'light' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(setUserSetting).toHaveBeenCalledWith('user123', 'theme', 'light');
    });
  });

  describe('POST /api/settings/pin', () => {
    it('should set a PIN if valid', async () => {
      const response = await request(app)
        .post('/api/settings/pin')
        .send({ pin: '1234' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(setUserPin).toHaveBeenCalledWith('user123', '1234');
    });

    it('should return 400 if PIN is too short', async () => {
      const response = await request(app)
        .post('/api/settings/pin')
        .send({ pin: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'PIN must be at least 4 digits' });
      expect(setUserPin).not.toHaveBeenCalled();
    });

    it('should return 400 if PIN is missing', async () => {
      const response = await request(app)
        .post('/api/settings/pin')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'PIN must be at least 4 digits' });
      expect(setUserPin).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/settings/pin/verify', () => {
    it('should verify correct PIN', async () => {
      vi.mocked(verifyUserPin).mockResolvedValue(true as never);

      const response = await request(app)
        .post('/api/settings/pin/verify')
        .send({ pin: '1234' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ valid: true });
      expect(verifyUserPin).toHaveBeenCalledWith('user123', '1234');
    });

    it('should reject incorrect PIN', async () => {
      vi.mocked(verifyUserPin).mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/settings/pin/verify')
        .send({ pin: '0000' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ valid: false });
      expect(verifyUserPin).toHaveBeenCalledWith('user123', '0000');
    });
  });
});
