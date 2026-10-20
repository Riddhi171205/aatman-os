import { Router } from 'express';
import { OrchestratorService } from '../services/orchestratorService';

const router = Router();

// Endpoint: POST /api/agent/run
router.post('/run', async (req, res) => {
    try {
        const { userGoal, userId } = req.body;
        
        if (!userGoal) {
            return res.status(400).json({ error: 'userGoal is required' });
        }

        // Run the multi-agent pipeline
        const result = await OrchestratorService.runGoal(userGoal, userId);

        res.json(result);
    } catch (error: any) {
        console.error('Agent execution error:', error);
        res.status(500).json({ error: 'Failed to execute multi-agent task', details: error.message });
    }
});

export default router;
