import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from '../db/pg';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aatman-dev-secret';

router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const existing = await dbService.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }
      // Simple dev hash fallback. Note: Real production uses bcrypt.
      const id = await dbService.createUser(username, password);
      
      const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, username } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
});

router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await dbService.getUserByUsername(username);
      if (!user || user.passwordHash !== password) {
          return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, username } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
});

router.get('/me', authenticateToken, async (req: any, res) => {
    res.json({ user: req.user });
});

export default router;
