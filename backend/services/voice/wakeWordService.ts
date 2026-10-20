export class WakeWordService {
    private isListening: boolean = false;

    /**
     * Initializes the Porcupine wake word engine.
     * Simulated for now to avoid native binary dependencies.
     */
    async init() {
        console.log("[WakeWordService] Initializing Porcupine engine with wake word 'Tom'...");
        // In a real app: this.porcupine = new Porcupine(accessKey, "Tom", modelPath);
        return true;
    }

    /**
     * Simulates continuous listening.
     */
    startListening(onWakeWordDetected: () => void) {
        this.isListening = true;
        console.log("[WakeWordService] Started listening for 'Tom'...");
        
        // Mock: Trigger after 10 seconds for testing purposes if we wanted automatic triggers.
        // In reality, frontend usually handles wake word if running in browser, or a local daemon does.
    }

    stopListening() {
        this.isListening = false;
        console.log("[WakeWordService] Stopped listening.");
    }
}

export const wakeWordService = new WakeWordService();
