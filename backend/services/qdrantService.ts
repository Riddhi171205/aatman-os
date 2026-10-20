import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'aatman_memory';

export class QdrantService {
    private client: QdrantClient | null = null;
    public isConnected = false;

    // Fallback in-memory embeddings list for local dev without Docker
    private mockEmbeddings: {id: string, vector: number[], payload: any}[] = [];

    constructor() {
        try {
            this.client = new QdrantClient({ url: QDRANT_URL });
            this.initCollection();
        } catch (e: any) {
            console.warn('⚠️ Qdrant connection failed, using mock embeddings', e.message);
        }
    }

    async initCollection() {
        if (!this.client) return;
        try {
            const res = await this.client.getCollections();
            const exists = res.collections.find(c => c.name === COLLECTION_NAME);
            
            if (!exists) {
                await this.client.createCollection(COLLECTION_NAME, {
                    vectors: {
                        size: 768, // size for nomic-embed-text
                        distance: 'Cosine',
                    }
                });
                console.log(`🧠 Created Qdrant collection: ${COLLECTION_NAME}`);
            }
            this.isConnected = true;
            console.log('🔗 Connected to Qdrant Vector DB');
        } catch (error: any) {
            console.warn('⚠️ Qdrant initialization failed, using mock.', error.message);
            this.isConnected = false;
        }
    }

    /**
     * Stores an embedding vector in Qdrant with its associated payload.
     */
    async storeEmbedding(userId: string, content: string, vector: number[], importance: number = 5) {
        const id = uuidv4();
        const payload = { user_id: userId, content, timestamp: Date.now(), importance };

        if (this.isConnected && this.client) {
            await this.client.upsert(COLLECTION_NAME, {
                points: [{
                    id,
                    vector,
                    payload
                }]
            });
            return id;
        }
        
        // Mock fallback
        this.mockEmbeddings.push({ id, vector, payload });
        return id;
    }

    /**
     * Searches Qdrant for similar vectors to retrieve relevant memories.
     */
    async searchSimilar(userId: string, queryVector: number[], limit: number = 3) {
        if (this.isConnected && this.client) {
            const results = await this.client.search(COLLECTION_NAME, {
                vector: queryVector,
                filter: {
                    must: [{ key: 'user_id', match: { value: userId } }]
                },
                limit,
                with_payload: true,
            });
            return results.map(r => ({
                payload: r.payload as { user_id: string, content: string, timestamp: number, importance: number },
                score: r.score
            }));
        }
        
        // Mock fallback (returns some text from user)
        return this.mockEmbeddings
            .filter(e => e.payload.user_id === userId)
            .slice(0, limit)
            .map(e => ({
                payload: e.payload as { user_id: string, content: string, timestamp: number, importance: number },
                score: 0.8 // mock score
            }));
    }
}

export const qdrantService = new QdrantService();
