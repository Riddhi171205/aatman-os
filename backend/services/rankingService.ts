interface MemoryCandidate {
    payload: {
        user_id: string;
        content: string;
        timestamp: number;
        importance: number;
    };
    score: number;
}

export class RankingService {
    /**
     * Ranks memories based on similarity, recency, and importance.
     */
    static rankMemories(candidates: MemoryCandidate[], limit: number = 3) {
        const now = Date.now();
        const maxTimeDiff = 30 * 24 * 60 * 60 * 1000; // 30 days decay baseline

        const scoredCandidates = candidates.map(candidate => {
            const payload = candidate.payload || ({} as any);

            // 1. Similarity Score
            const similarityScore = candidate.score || 0;

            // 2. Importance Score
            const importance = payload.importance || 5;
            const normalizedImportance = importance / 10.0;

            // 3. Recency Score
            const timestamp = payload.timestamp || now;
            const timeDiff = now - timestamp;
            let recencyScore = 1.0 - (timeDiff / maxTimeDiff);
            if (recencyScore < 0.1) recencyScore = 0.1; // Baseline for very old memories

            // Composite Score Formula: 50% Similarity, 30% Importance, 20% Recency
            const finalScore = (similarityScore * 0.5) + (normalizedImportance * 0.3) + (recencyScore * 0.2);

            return {
                ...candidate,
                finalScore
            };
        });

        // Sort descending by finalScore
        scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

        return scoredCandidates.slice(0, limit);
    }
}
