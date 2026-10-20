import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// --- 1. Type Definitions ---
interface User {
    id: string;
    username: string;
    passwordHash: string;
}
interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at: Date;
}
interface ChatMessage {
    id: string;
    user_id: string;
    session_id: string;
    role: string;
    content: string;
    created_at: Date;
}
interface MemoryLog {
    id: string;
    message_id: string;
    importance_score: number;
    tags: string[];
    created_at: Date;
}
interface Summary {
    id: string;
    session_id: string;
    summary_text: string;
    created_at: Date;
}

const DATABASE_URL = process.env.DATABASE_URL;

class DB {
    private pool: Pool | null = null;
    public isConnected = false;

    // In-memory fallback with types
    private mockDb = {
        users: [] as User[],
        chat_sessions: [] as ChatSession[],
        chat_messages: [] as ChatMessage[],
        memory_logs: [] as MemoryLog[],
        summaries: [] as Summary[],
    };

    // --- 2. Async Initialization ---
    public async init() {
        if (DATABASE_URL) {
            this.pool = new Pool({ connectionString: DATABASE_URL });
            try {
                await this.pool.connect();
                console.log('🔗 Connected to Postgres DB');
                this.isConnected = true;
                await this.initTables();
            } catch (e: any) {
                console.warn('⚠️ Postgres connection failed, using in-memory mock', e.message);
            }
        } else {
            console.warn('⚠️ No DATABASE_URL provided, using in-memory mock');
        }
    }

    private async initTables() {
        if (!this.isConnected || !this.pool) return;
        try {
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL
                );
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id UUID PRIMARY KEY,
                    user_id UUID REFERENCES users(id),
                    title VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id UUID PRIMARY KEY,
                    user_id UUID REFERENCES users(id),
                    session_id UUID REFERENCES chat_sessions(id),
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS memory_logs (
                    id UUID PRIMARY KEY,
                    message_id UUID REFERENCES chat_messages(id),
                    importance_score INTEGER DEFAULT 5,
                    tags TEXT[],
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS summaries (
                    id UUID PRIMARY KEY,
                    session_id UUID REFERENCES chat_sessions(id),
                    summary_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Postgres tables initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize tables', error.message);
        }
    }

    // --- 3. Improved Error Handling ---
    async query(text: string, params?: any[]) {
        if (this.isConnected && this.pool) {
            try {
                return await this.pool.query(text, params);
            } catch (err: any) {
                console.error('DB Query Error:', err.message);
                throw err;
            }
        }
        return { rows: [] };
    }

    // --- 4. Typed CRUD Methods ---
    async createUser(username: string, passwordHash: string): Promise<string> {
        const id = uuidv4();
        if (this.isConnected) {
            const res = await this.query(
                `INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3) RETURNING id`,
                [id, username, passwordHash]
            );
            return res.rows[0].id;
        }
        this.mockDb.users.push({ id, username, passwordHash });
        return id;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        if (this.isConnected) {
            const res = await this.query(`SELECT * FROM users WHERE username = $1`, [username]);
            if (res.rows[0]) {
                return {
                    id: res.rows[0].id,
                    username: res.rows[0].username,
                    passwordHash: res.rows[0].password_hash,
                };
            }
            return undefined;
        }
        return this.mockDb.users.find(u => u.username === username);
    }

    async getUserById(id: string): Promise<User | undefined> {
        if (this.isConnected) {
            const res = await this.query(`SELECT * FROM users WHERE id = $1`, [id]);
            if (res.rows[0]) {
                return {
                    id: res.rows[0].id,
                    username: res.rows[0].username,
                    passwordHash: res.rows[0].password_hash,
                };
            }
            return undefined;
        }
        return this.mockDb.users.find(u => u.id === id);
    }

    // Sessions
    async createSession(userId: string, title: string): Promise<ChatSession> {
        const id = uuidv4();
        if (this.isConnected) {
            const res = await this.query(
                `INSERT INTO chat_sessions (id, user_id, title) VALUES ($1, $2, $3) RETURNING *`,
                [id, userId, title]
            );
            return res.rows[0];
        }
        const session: ChatSession = { id, user_id: userId, title, created_at: new Date() };
        this.mockDb.chat_sessions.push(session);
        return session;
    }

    async getSessions(userId: string): Promise<ChatSession[]> {
        if (this.isConnected) {
            const res = await this.query(`SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
            return res.rows;
        }
        return this.mockDb.chat_sessions.filter(c => c.user_id === userId).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    // Messages
    async addMessage(userId: string, sessionId: string, role: string, content: string): Promise<ChatMessage> {
        const id = uuidv4();
        if (this.isConnected) {
            const res = await this.query(
                `INSERT INTO chat_messages (id, user_id, session_id, role, content) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [id, userId, sessionId, role, content]
            );
            return res.rows[0];
        }
        const msg: ChatMessage = { id, user_id: userId, session_id: sessionId, role, content, created_at: new Date() };
        this.mockDb.chat_messages.push(msg);
        return msg;
    }

    async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
        if (this.isConnected) {
            const res = await this.query(
                `SELECT * FROM (SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2) AS sub ORDER BY created_at ASC`,
                [sessionId, limit]
            );
            return res.rows;
        }
        const msgs = this.mockDb.chat_messages
            .filter(m => m.session_id === sessionId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
            .slice(0, limit)
            .reverse();
        return msgs;
    }

    // Memory Logs
    async addMemoryLog(messageId: string, importanceScore: number = 5, tags: string[] = []): Promise<MemoryLog> {
        const id = uuidv4();
        if (this.isConnected) {
            const res = await this.query(
                `INSERT INTO memory_logs (id, message_id, importance_score, tags) VALUES ($1, $2, $3, $4) RETURNING *`,
                [id, messageId, importanceScore, tags]
            );
            return res.rows[0];
        }
        const log: MemoryLog = { id, message_id: messageId, importance_score: importanceScore, tags, created_at: new Date() };
        this.mockDb.memory_logs.push(log);
        return log;
    }

    // Summaries
    async addSummary(sessionId: string, summaryText: string): Promise<Summary> {
        const id = uuidv4();
        if (this.isConnected) {
            const res = await this.query(
                `INSERT INTO summaries (id, session_id, summary_text) VALUES ($1, $2, $3) RETURNING *`,
                [id, sessionId, summaryText]
            );
            return res.rows[0];
        }
        const summary: Summary = { id, session_id: sessionId, summary_text: summaryText, created_at: new Date() };
        this.mockDb.summaries.push(summary);
        return summary;
    }

    async getLatestSummary(sessionId: string): Promise<Summary | undefined> {
        if (this.isConnected) {
            const res = await this.query(
                `SELECT * FROM summaries WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [sessionId]
            );
            return res.rows[0];
        }
        const summaries = this.mockDb.summaries
            .filter(s => s.session_id === sessionId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        return summaries[0];
    }

    async getMessagesCount(sessionId: string): Promise<number> {
        if (this.isConnected) {
            const res = await this.query(
                `SELECT COUNT(*) FROM chat_messages WHERE session_id = $1`,
                [sessionId]
            );
            return parseInt(res.rows[0].count, 10);
        }
        return this.mockDb.chat_messages.filter(m => m.session_id === sessionId).length;
    }
}

// --- 5. Export and Usage ---
export const dbService = new DB();
// In your app's entrypoint, call: await dbService.init();
