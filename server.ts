import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createServer } from 'http';

// Routers
import authRouter from './backend/routes/auth';
import chatRouter from './backend/routes/chat';
import memoryRouter from './backend/routes/memory';
import agentRouter from './backend/routes/agent';
import voiceRouter from './backend/routes/voice';
import executionRouter from './backend/routes/execution';
import airControlRouter from './backend/routes/aircontrol';
import settingsRouter from './backend/routes/settings';
import brainRouter from './backend/routes/brain';

// Initialize App
const app = express();
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter); 
app.use('/api/memory', memoryRouter);
app.use('/api/agent', agentRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/execute', executionRouter);
app.use('/api/aircontrol', airControlRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/brain', brainRouter);

// --- Uploads ---
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './backend/db/pg';
import { authenticateToken } from './backend/middleware/auth';

const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const fileRecord = {
        id: uuidv4(),
        userId: req.user.id,
        filename: req.file.originalname,
        filepath: req.file.path,
        fileType: req.file.mimetype,
        createdAt: Date.now()
    };
    // To complete this properly we would add dbService.addFile(req.user.id, fileRecord)
    // For now we just return it
    res.json(fileRecord);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  const server = createServer(app);

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing dev server or run with another port, for example: PORT=${PORT + 1} npm run dev`);
      process.exit(1);
    }

    throw error;
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`AATMAN OS Server running on http://localhost:${PORT}`);
  });
}

// DB and OS Kernel initialization
import { osKernel } from './backend/os/kernel';

async function main() {
    await dbService.init();
    osKernel.registerModule('db', dbService);

    // Example: Add a background task
    osKernel.addTask(async () => {
        console.log('Background OS task running!');
        // Access dbService via osKernel.getModule('db')
    });

    await osKernel.runAllTasks();
}

main();

startServer();

// Example usage in another service
// const db = osKernel.getModule<typeof dbService>('db');
// if (db) {
//     // Use db methods
// }
