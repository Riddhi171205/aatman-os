import { Router } from 'express';
import multer from 'multer';
import { VoiceControllerService } from '../services/voice/voiceControllerService';
import { ChatService } from '../services/chatService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Keep audio in memory

// Endpoint: POST /api/voice/process
router.post('/process', upload.single('audio'), async (req: any, res) => {
    try {
        const { userId, sessionId } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: 'userId and sessionId are required' });
        }

        let audioBuffer: Buffer;

        if (req.file) {
            audioBuffer = req.file.buffer;
        } else if (req.body.audio) {
            // Support base64 string fallback
            const base64Data = req.body.audio.replace(/^data:audio\/\w+;base64,/, "");
            audioBuffer = Buffer.from(base64Data, 'base64');
        } else {
            return res.status(400).json({ error: 'No audio file or base64 string provided' });
        }

        const result = await VoiceControllerService.processVoiceInput(audioBuffer, userId, sessionId);

        res.json(result);
    } catch (error: any) {
        console.error('Voice processing error:', error);
        res.status(500).json({ error: 'Failed to process voice input', details: error.message });
    }
});

// Endpoint: POST /api/voice/respond
// Uses browser-provided speech recognition text and runs the normal assistant flow.
router.post('/respond', async (req: any, res) => {
    try {
        const { userId, sessionId, text } = req.body;

        if (!userId || !sessionId || !text) {
            return res.status(400).json({ error: 'userId, sessionId, and text are required' });
        }

        const chatResult = await ChatService.handleUserChat(userId, sessionId, text, { fastMode: true });

        res.json({
            text,
            response: chatResult.response,
            audio: "",
            messageId: chatResult.messageId,
            observability: chatResult.observability
        });
    } catch (error: any) {
        console.error('Voice response error:', error);
        res.status(500).json({ error: 'Failed to process voice text', details: error.message });
    }
});

export default router;
