import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { setUserSetting, getUserSetting, getAllUserSettings, setUserPin, verifyUserPin } from '../os/settings';

const router = express.Router();

router.get('/', authenticateToken, (req: any, res) => {
  res.json(getAllUserSettings(req.user.id));
});

router.get('/:key', authenticateToken, (req: any, res) => {
  const value = getUserSetting(req.user.id, req.params.key);
  res.json({ value });
});

router.post('/', authenticateToken, (req: any, res) => {
  const { key, value } = req.body;
  setUserSetting(req.user.id, key, value);
  res.json({ success: true });
});

// Set PIN
router.post('/pin', authenticateToken, async (req: any, res) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string' || pin.length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 digits' });
  }
  await setUserPin(req.user.id, pin);
  res.json({ success: true });
});

// Verify PIN
router.post('/pin/verify', authenticateToken, async (req: any, res) => {
  const { pin } = req.body;
  const valid = await verifyUserPin(req.user.id, pin);
  res.json({ valid });
});

export default router;