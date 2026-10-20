import { exec } from 'child_process';

export function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) return reject({ error: error.message, stderr });
            resolve({ stdout, stderr });
        });
    });
}