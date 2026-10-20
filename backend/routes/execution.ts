import { Router } from 'express';
import { ExecutionController } from '../services/execution/executionController';

const router = Router();

// Endpoint: POST /api/execute
router.post('/', async (req, res) => {
    try {
        const { action, params } = req.body;
        
        if (!action || !params) {
            return res.status(400).json({ status: 'error', result: 'Action and params are required.' });
        }

        const response = await ExecutionController.handleAction(action, params);
        res.json(response);
        
    } catch (error: any) {
        console.error('Execution API error:', error);
        res.status(500).json({ status: 'error', result: error.message });
    }
});

export default router;
