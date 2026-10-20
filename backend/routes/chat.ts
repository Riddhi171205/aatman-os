import { Router } from 'express';
import { ChatService } from '../services/chatService';
import { dbService } from '../db/pg';

const router = Router();

// Endpoint: POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { userId, sessionId, message, engine } = req.body;
        
        if (!userId || !sessionId || !message) {
            return res.status(400).json({ error: 'userId, sessionId, and message are required' });
        }

        if (engine !== undefined && engine !== 'llm' && engine !== 'brain') {
            return res.status(400).json({ error: "engine must be 'llm' or 'brain'" });
        }

        const result = await ChatService.handleUserChat(userId, sessionId, message, { fastMode: true, engine });
        
        res.json({
            message: result.response,
            messageId: result.messageId,
            observability: result.observability
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Endpoint: POST /api/chat/session
router.post('/session', async (req, res) => {
    try {
        const { userId, title } = req.body;
        if (!userId || !title) {
            return res.status(400).json({ error: 'userId and title are required' });
        }

        const session = await dbService.createSession(userId, title);
        res.json({ session });
    } catch (error: any) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Endpoint: GET /api/chat/sessions/:userId
router.get('/sessions/:userId', async (req, res) => {
    try {
        const sessions = await dbService.getSessions(req.params.userId);
        res.json({ sessions });
    } catch (error: any) {
        console.error('Fetch sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

export default router;
