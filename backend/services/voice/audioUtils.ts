import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export class AudioUtils {
    /**
     * Normalizes an incoming audio buffer (e.g., WebM from browser) into WAV format (16kHz, Mono).
     * Saves the intermediate and final files to disk for debugging.
     */
    static async normalizeAudio(inputBuffer: Buffer): Promise<string> {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const id = uuidv4();
        const inputPath = path.join(tmpDir, `${id}_input.webm`);
        const outputPath = path.join(tmpDir, `${id}_debug.wav`);

        // Write the incoming buffer to disk
        fs.writeFileSync(inputPath, inputBuffer);

        try {
            // Use ffmpeg to convert to 16kHz, mono, PCM 16-bit WAV
            await execAsync(`ffmpeg -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputPath} -y`);
            return outputPath;
        } catch (error: any) {
            console.error("[AudioUtils] FFmpeg normalization failed:", error.message);
            throw new Error(`Audio normalization failed. Ensure ffmpeg is installed. Details: ${error.message}`);
        } finally {
            // Clean up the input file, but leave the debug.wav for inspection
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
        }
    }
}
