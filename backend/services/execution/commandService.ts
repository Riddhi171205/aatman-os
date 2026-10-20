import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CommandService {
    // A basic blacklist to prevent destructive commands
    private static blacklistPatterns = [
        /rm\s+-rf/,
        /sudo/,
        /mkfs/,
        /dd\s+if=/,
        />\s*\/dev\/sd/,
        /chmod\s+-R\s+777/,
        /chown\s+-R/
    ];

    static async runCommand(command: string): Promise<string> {
        console.log(`[CommandService] Validating command: ${command}`);
        
        // Security Check
        for (const pattern of this.blacklistPatterns) {
            if (pattern.test(command)) {
                console.warn(`[CommandService] BLOCKED unauthorized command: ${command}`);
                throw new Error("Security Error: Execution of this command is restricted by the AATMAN OS Execution Layer.");
            }
        }

        console.log(`[CommandService] Executing command: ${command}`);
        
        try {
            const { stdout, stderr } = await execAsync(command);
            if (stderr && !stdout) {
                return `Completed with stderr: ${stderr}`;
            }
            return stdout.trim();
        } catch (error: any) {
            console.error(`[CommandService] Execution failed:`, error.message);
            throw new Error(`Command failed: ${error.message}`);
        }
    }
}
