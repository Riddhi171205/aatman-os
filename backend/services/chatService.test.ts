import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../db/pg', () => ({
  dbService: {
    addMessage: vi.fn(async (_userId: string, _sessionId: string, role: string) => ({ id: `${role}-msg` })),
    getRecentMessages: vi.fn(async () => []),
    getLatestSummary: vi.fn(async () => null)
  }
}));

vi.mock('./memoryService', () => ({
  MemoryService: {
    evaluateAndStore: vi.fn(async () => undefined),
    getRelevantPastMemory: vi.fn(async () => '')
  }
}));

vi.mock('./summarizationService', () => ({
  SummarizationService: { summarizeSessionIfNeeded: vi.fn(async () => undefined) }
}));

vi.mock('./brainService', () => ({
  BrainService: { think: vi.fn() }
}));

import { ChatService } from './chatService';
import { BrainService } from './brainService';

const decision = {
  response: 'Brain answer',
  intent: { label: 'planning_request', goal: 'g', entities: {}, urgency: 3, confidence: 0.72 },
  plan: [{ id: 'step-1', description: 'd', priority: 1, dependencies: [], status: 'pending' }],
  memory_context: [],
  knowledge_context: [],
  simulation: { summary: 's', predicted_outcomes: [], risks: [], confidence: 0.68 },
  explanation: { why: [], alternatives: [], contradictions: [], reflection: 'r', confidence: 0.72 },
  session_id: 'user123:s1'
};

describe('ChatService engine routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ChatService, 'generateCompletionWithMetadata').mockResolvedValue({ text: 'LLM answer', model: 'llama3 (local)' });
  });

  it('should use the LLM chain by default', async () => {
    const result = await ChatService.handleUserChat('user123', 's1', 'hello', { fastMode: true });

    expect(result.response).toBe('LLM answer');
    expect(result.observability.engine).toBe('llm');
    expect(result.observability.brainFallback).toBe(false);
    expect(BrainService.think).not.toHaveBeenCalled();
  });

  it('should answer through the brain when engine is brain', async () => {
    (BrainService.think as any).mockResolvedValue(decision);

    const result = await ChatService.handleUserChat('user123', 's1', 'plan my week', { fastMode: true, engine: 'brain' });

    expect(BrainService.think).toHaveBeenCalledWith('plan my week', 'user123:s1');
    expect(ChatService.generateCompletionWithMetadata).not.toHaveBeenCalled();
    expect(result.response).toBe('Brain answer');
    expect(result.observability.activeModel).toBe('aatman-brain');
    expect(result.observability.brain?.plan).toHaveLength(1);
  });

  it('should fall back to the LLM chain when the brain is offline', async () => {
    (BrainService.think as any).mockResolvedValue(null);

    const result = await ChatService.handleUserChat('user123', 's1', 'hello', { fastMode: true, engine: 'brain' });

    expect(result.response).toBe('LLM answer');
    expect(result.observability.engine).toBe('llm');
    expect(result.observability.brainFallback).toBe(true);
    expect(result.observability.brain).toBeUndefined();
  });
});
