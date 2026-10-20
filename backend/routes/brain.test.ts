import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import brainRouter from './brain';

// Mock dependencies
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'user123' }; // Mock authenticated user
    next();
  }
}));

vi.mock('../services/brainService', () => ({
  BrainService: {
    url: 'http://localhost:8001',
    status: vi.fn(),
    think: vi.fn(),
    runAgents: vi.fn(),
    agentFeedback: vi.fn(),
    remember: vi.fn(),
    retrieve: vi.fn(),
    ingestText: vi.fn()
  }
}));

import { BrainService } from '../services/brainService';

const app = express();
app.use(express.json());
app.use('/api/brain', brainRouter);

describe('Brain Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/brain/status', () => {
    it('should report brain health', async () => {
      const status = { online: true, url: 'http://localhost:8001', checkedAt: 1 };
      (BrainService.status as any).mockResolvedValue(status);

      const res = await request(app).get('/api/brain/status');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(status);
      expect(BrainService.status).toHaveBeenCalledWith(false);
    });

    it('should force a fresh check with refresh=1', async () => {
      (BrainService.status as any).mockResolvedValue({ online: false });

      await request(app).get('/api/brain/status?refresh=1');

      expect(BrainService.status).toHaveBeenCalledWith(true);
    });
  });

  describe('POST /api/brain/think', () => {
    it('should namespace the session per user', async () => {
      (BrainService.think as any).mockResolvedValue({ response: 'ok' });

      const res = await request(app).post('/api/brain/think').send({ input: 'hello', sessionId: 's1' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ response: 'ok' });
      expect(BrainService.think).toHaveBeenCalledWith('hello', 'user123:s1');
    });

    it('should use a default session when none is given', async () => {
      (BrainService.think as any).mockResolvedValue({ response: 'ok' });

      await request(app).post('/api/brain/think').send({ input: 'hello' });

      expect(BrainService.think).toHaveBeenCalledWith('hello', 'user123:default');
    });

    it('should return 400 if input is missing', async () => {
      const res = await request(app).post('/api/brain/think').send({});

      expect(res.status).toBe(400);
      expect(BrainService.think).not.toHaveBeenCalled();
    });

    it('should return 503 when the brain is offline', async () => {
      (BrainService.think as any).mockResolvedValue(null);

      const res = await request(app).post('/api/brain/think').send({ input: 'hello' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('AATMAN Brain is offline');
    });
  });

  describe('POST /api/brain/agents/run', () => {
    it('should run the agent society', async () => {
      (BrainService.runAgents as any).mockResolvedValue({ final_output: 'done' });

      const res = await request(app).post('/api/brain/agents/run').send({ goal: 'build it', sessionId: 's1' });

      expect(res.status).toBe(200);
      expect(BrainService.runAgents).toHaveBeenCalledWith('build it', 'user123:s1');
    });

    it('should return 400 if goal is missing', async () => {
      const res = await request(app).post('/api/brain/agents/run').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/brain/agents/feedback', () => {
    it('should forward valid feedback', async () => {
      (BrainService.agentFeedback as any).mockResolvedValue({ learned: 'x' });

      const res = await request(app).post('/api/brain/agents/feedback').send({ goal: 'g', feedback: 'good', score: 5 });

      expect(res.status).toBe(200);
      expect(BrainService.agentFeedback).toHaveBeenCalledWith('user123:default', 'g', 'good', 5);
    });

    it('should reject an out-of-range score', async () => {
      const res = await request(app).post('/api/brain/agents/feedback').send({ goal: 'g', feedback: 'good', score: 9 });

      expect(res.status).toBe(400);
      expect(BrainService.agentFeedback).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/brain/retrieve', () => {
    it('should retrieve memories for the user session', async () => {
      (BrainService.retrieve as any).mockResolvedValue({ memory: [] });

      const res = await request(app).get('/api/brain/retrieve?query=exams&sessionId=s1');

      expect(res.status).toBe(200);
      expect(BrainService.retrieve).toHaveBeenCalledWith('exams', 'user123:s1');
    });
  });

  describe('POST /api/brain/knowledge/text', () => {
    it('should not leak the absolute filesystem path', async () => {
      (BrainService.ingestText as any).mockResolvedValue({ status: 'ingested', path: '/srv/aatman/data/knowledge/notes.txt' });

      const res = await request(app).post('/api/brain/knowledge/text').send({ name: 'notes.txt', content: 'hi' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ingested', name: 'notes.txt' });
    });
  });
});
