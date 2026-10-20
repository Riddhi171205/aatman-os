import express from 'express';
import { dispatchCommand } from '../os/commandDispatcher';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/run', authenticateToken, async (req, res) => {
    const { command, args } = req.body;
    if (!command) return res.status(400).json({ error: 'No command provided' });
    try {
        const result = await dispatchCommand(command, args);
        res.json({ result });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/send_whatsapp', authenticateToken, async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const result = await dispatchCommand('send_whatsapp', { to, message });
        res.json({ result });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/web_search', authenticateToken, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });
    try {
        const result = await dispatchCommand('web_search', { query });
        res.json({ result });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;