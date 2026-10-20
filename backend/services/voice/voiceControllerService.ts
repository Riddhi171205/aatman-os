import { SpeechToTextService } from './speechToTextService';
import { TextToSpeechService } from './textToSpeechService';
import { ChatService } from '../chatService';

export interface VoiceProcessResult {
    text: string;
    response: string;
    audio: string;
}

export class VoiceControllerService {
    /**
     * Full pipeline: STT -> Chat AI -> TTS
     */
    static async processVoiceInput(audioBuffer: Buffer, userId: string, sessionId: string): Promise<VoiceProcessResult> {
        console.log(`[VoiceController] Starting pipeline. Received buffer size: ${audioBuffer.length} bytes`);

        let transcribedText = "";
        try {
            // 1. Speech to Text
            transcribedText = await SpeechToTextService.transcribe(audioBuffer);
            console.log(`[VoiceController] Transcribed Text: "${transcribedText}"`);
        } catch (sttError: any) {
            console.error(`[VoiceController] STT Failed:`, sttError.message);
            // Return early with structured error response if STT completely fails
            return {
                text: "[Transcription Failed]",
                response: "I had trouble hearing that. Could you check your microphone and try again?",
                audio: ""
            };
        }

        // 2. Process with AI System (Memory/Agent integrated via ChatService)
        let aiResponseText = "I couldn't process that.";
        if (transcribedText) {
            try {
                const chatResult = await ChatService.handleUserChat(userId, sessionId, transcribedText);
                aiResponseText = chatResult.response;
            } catch (chatError: any) {
                console.error(`[VoiceController] Chat Processing Failed:`, chatError.message);
                aiResponseText = "I heard you, but I encountered an error processing your request.";
            }
        }

        // 3. Text to Speech
        let audioBase64 = "";
        try {
            audioBase64 = await TextToSpeechService.synthesize(aiResponseText);
        } catch (ttsError: any) {
            console.error(`[VoiceController] TTS Failed:`, ttsError.message);
        }

        console.log(`[VoiceController] Pipeline complete.`);

        return {
            text: transcribedText,
            response: aiResponseText,
            audio: audioBase64
        };
    }
}
