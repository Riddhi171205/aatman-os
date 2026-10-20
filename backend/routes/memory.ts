import { Router } from 'express';
import { dbService } from '../db/pg';
import { MemoryService } from '../services/memoryService';
import { qdrantService } from '../services/qdrantService';
import { EmbeddingService } from '../services/embeddingService';
import { SummarizationService } from '../services/summarizationService';

const router = Router();

// Endpoint: GET /api/memory/:sessionId (fetch history/STM)
router.get('/:sessionId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const messages = await dbService.getRecentMessages(req.params.sessionId, limit);
        res.json({ messages });
    } catch (error: any) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
});

// Endpoint: POST /api/memory/save (store explicit LTM memory)
router.post('/save', async (req, res) => {
    try {
        const { userId, messageId, content, importanceScore, tags } = req.body;
        
        if (!userId || !messageId || !content) {
            return res.status(400).json({ error: 'userId, messageId, and content are required' });
        }

        const success = await MemoryService.storeMemory(
            userId, 
            messageId, 
            content, 
            importanceScore || 5, 
            tags || []
        );

        if (success) {
            res.json({ message: 'Memory stored successfully' });
        } else {
            res.status(500).json({ error: 'Failed to store memory' });
        }
    } catch (error: any) {
        console.error('Memory save error:', error);
        res.status(500).json({ error: 'Failed to save memory' });
    }
});

// Endpoint: GET /api/memory/search (retrieve similar memory)
router.get('/search', async (req, res) => {
    try {
        const { userId, query, limit } = req.query;
        
        if (!userId || !query) {
            return res.status(400).json({ error: 'userId and query parameters are required' });
        }

        const queryVector = await EmbeddingService.generateEmbedding(query as string);
        const matches = await qdrantService.searchSimilar(userId as string, queryVector, parseInt(limit as string) || 5);
        
        res.json({ matches });
    } catch (error: any) {
        console.error('Memory search error:', error);
        res.status(500).json({ error: 'Failed to search memories' });
    }
});

// Endpoint: POST /api/memory/summarize (manually trigger a summary)
router.post('/summarize', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        await SummarizationService.generateAndStoreSummary(sessionId);
        const latestSummary = await dbService.getLatestSummary(sessionId);

        res.json({ message: 'Summary generated successfully', summary: latestSummary });
    } catch (error: any) {
        console.error('Memory summarize error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

export default router;
