/**
 * Bridge to the Python AATMAN BRAIN service (aatman_brain/api/main.py).
 * Every call fails soft: callers get null and fall back to the Node pipeline.
 */

const BRAIN_URL = (process.env.BRAIN_URL || 'http://localhost:8001').replace(/\/$/, '');
const BRAIN_TIMEOUT_MS = Number(process.env.BRAIN_TIMEOUT_MS || 8000);
const HEALTH_TIMEOUT_MS = 1000;
const HEALTH_CACHE_MS = 5000;

export interface BrainPlanStep {
    id: string;
    description: string;
    priority: number;
    dependencies: string[];
    status: string;
}

export interface BrainRetrievedItem {
    source: string;
    content: string;
    score: number;
    metadata: Record<string, any>;
}

export interface BrainDecision {
    response: string;
    intent: { label: string; goal: string; entities: Record<string, any>; urgency: number; confidence: number };
    plan: BrainPlanStep[];
    memory_context: BrainRetrievedItem[];
    knowledge_context: BrainRetrievedItem[];
    simulation: { summary: string; predicted_outcomes: string[]; risks: string[]; confidence: number };
    explanation: { why: string[]; alternatives: string[]; contradictions: string[]; reflection: string; confidence: number };
    session_id: string;
}

export interface BrainSocietyRun {
    session_id: string;
    goal: string;
    route: string[];
    final_output: string;
    tasks: any[];
    agent_results: any[];
    messages: any[];
    critique: any;
    refinement: string;
    learned_items: any[];
    confidence: number;
    created_at: string;
}

export interface BrainStatus {
    online: boolean;
    url: string;
    checkedAt: number;
}

let cachedStatus: BrainStatus | null = null;

export class BrainService {

    static get url() {
        return BRAIN_URL;
    }

    private static async request<T>(path: string, init: RequestInit = {}, timeoutMs = BRAIN_TIMEOUT_MS): Promise<T | null> {
        try {
            const response = await fetch(`${BRAIN_URL}${path}`, {
                ...init,
                signal: AbortSignal.timeout(timeoutMs),
                headers: { 'Content-Type': 'application/json', ...init.headers },
            });
            if (!response.ok) {
                console.error(`[Brain] ${path} returned ${response.status}`);
                return null;
            }
            return await response.json() as T;
        } catch (error: any) {
            // Connection refused / timeout: the brain is simply not running.
            if (cachedStatus) cachedStatus = { ...cachedStatus, online: false, checkedAt: Date.now() };
            return null;
        }
    }

    private static post<T>(path: string, body: unknown) {
        return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
    }

    /**
     * Health check, cached briefly so status polling doesn't hammer the brain.
     */
    static async status(force = false): Promise<BrainStatus> {
        if (!force && cachedStatus && Date.now() - cachedStatus.checkedAt < HEALTH_CACHE_MS) {
            return cachedStatus;
        }
        const health = await this.request<{ status: string }>('/health', {}, HEALTH_TIMEOUT_MS);
        cachedStatus = { online: health?.status === 'ok', url: BRAIN_URL, checkedAt: Date.now() };
        return cachedStatus;
    }

    static think(input: string, sessionId?: string) {
        return this.post<BrainDecision>('/think', { input, session_id: sessionId });
    }

    static runAgents(goal: string, sessionId?: string) {
        return this.post<BrainSocietyRun>('/agents/run', { goal, session_id: sessionId });
    }

    static agentFeedback(sessionId: string, goal: string, feedback: string, score?: number) {
        return this.post<Record<string, any>>('/agents/feedback', { session_id: sessionId, goal, feedback, score });
    }

    static remember(sessionId: string, content: string, kind = 'fact') {
        return this.post<Record<string, any>>('/memory', { session_id: sessionId, content, kind });
    }

    static retrieve(query: string, sessionId?: string) {
        const params = new URLSearchParams({ query });
        if (sessionId) params.set('session_id', sessionId);
        return this.request<Record<string, BrainRetrievedItem[]>>(`/retrieve?${params}`);
    }

    static ingestText(name: string, content: string) {
        return this.post<{ status: string; path: string }>('/knowledge/text', { name, content });
    }

    static ingestUrl(url: string) {
        return this.post<{ status: string; path: string }>('/knowledge/url', { url });
    }
}
