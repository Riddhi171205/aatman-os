import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { BrainService } from '../services/brainService';

const router = Router();

// Brain memory is keyed by session id, so namespace it per user.
const brainSession = (req: any, sessionId?: string) => `${req.user.id}:${sessionId || 'default'}`;

const offline = (res: any) => res.status(503).json({ error: 'AATMAN Brain is offline', brainUrl: BrainService.url });

// Endpoint: GET /api/brain/status
router.get('/status', async (req, res) => {
    const status = await BrainService.status(req.query.refresh === '1');
    res.json(status);
});

// Endpoint: POST /api/brain/think
router.post('/think', authenticateToken, async (req: any, res) => {
    const { input, sessionId } = req.body;
    if (!input) return res.status(400).json({ error: 'input is required' });

    const decision = await BrainService.think(input, brainSession(req, sessionId));
    if (!decision) return offline(res);
    res.json(decision);
});

// Endpoint: POST /api/brain/agents/run
router.post('/agents/run', authenticateToken, async (req: any, res) => {
    const { goal, sessionId } = req.body;
    if (!goal) return res.status(400).json({ error: 'goal is required' });

    const run = await BrainService.runAgents(goal, brainSession(req, sessionId));
    if (!run) return offline(res);
    res.json(run);
});

// Endpoint: POST /api/brain/agents/feedback
router.post('/agents/feedback', authenticateToken, async (req: any, res) => {
    const { sessionId, goal, feedback, score } = req.body;
    if (!goal || !feedback) return res.status(400).json({ error: 'goal and feedback are required' });
    if (score !== undefined && (!Number.isInteger(score) || score < 1 || score > 5)) {
        return res.status(400).json({ error: 'score must be an integer from 1 to 5' });
    }

    const result = await BrainService.agentFeedback(brainSession(req, sessionId), goal, feedback, score);
    if (!result) return offline(res);
    res.json(result);
});

// Endpoint: POST /api/brain/memory
router.post('/memory', authenticateToken, async (req: any, res) => {
    const { sessionId, content, kind } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const item = await BrainService.remember(brainSession(req, sessionId), content, kind);
    if (!item) return offline(res);
    res.json(item);
});

// Endpoint: GET /api/brain/retrieve?query=...&sessionId=...
router.get('/retrieve', authenticateToken, async (req: any, res) => {
    const query = req.query.query as string | undefined;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const result = await BrainService.retrieve(query, brainSession(req, req.query.sessionId as string | undefined));
    if (!result) return offline(res);
    res.json(result);
});

// Endpoint: POST /api/brain/knowledge/text
router.post('/knowledge/text', authenticateToken, async (req: any, res) => {
    const { name, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'name and content are required' });

    const result = await BrainService.ingestText(name, content);
    if (!result) return offline(res);
    // Don't leak the brain's absolute filesystem path to clients.
    res.json({ status: result.status, name: result.path.split(/[\\/]/).pop() });
});

export default router;
