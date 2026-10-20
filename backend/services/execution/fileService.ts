import fs from 'fs/promises';
import path from 'path';

export class FileService {
    // Restrict all operations to a specific workspace directory
    private static WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

    /**
     * Initializes the workspace directory if it doesn't exist.
     */
    private static async ensureWorkspace() {
        try {
            await fs.mkdir(this.WORKSPACE_DIR, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }
    }

    /**
     * Resolves and validates a file path to ensure it stays within the workspace.
     */
    private static resolveSafePath(filePath: string): string {
        // Prevent directory traversal attacks
        const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const safePath = path.resolve(this.WORKSPACE_DIR, normalizedPath);
        
        if (!safePath.startsWith(this.WORKSPACE_DIR)) {
            throw new Error("Security Error: Path traversal detected. Access denied outside workspace.");
        }
        return safePath;
    }

    static async readFile(filePath: string): Promise<string> {
        await this.ensureWorkspace();
        const safePath = this.resolveSafePath(filePath);
        console.log(`[FileService] Reading file: ${safePath}`);
        return await fs.readFile(safePath, 'utf8');
    }

    static async writeFile(filePath: string, content: string): Promise<string> {
        await this.ensureWorkspace();
        const safePath = this.resolveSafePath(filePath);
        console.log(`[FileService] Writing to file: ${safePath}`);
        await fs.writeFile(safePath, content, 'utf8');
        return `File successfully written to workspace/${filePath}`;
    }

    static async listFiles(subDir: string = ""): Promise<string[]> {
        await this.ensureWorkspace();
        const safePath = this.resolveSafePath(subDir);
        console.log(`[FileService] Listing files in: ${safePath}`);
        const files = await fs.readdir(safePath);
        return files;
    }
}
