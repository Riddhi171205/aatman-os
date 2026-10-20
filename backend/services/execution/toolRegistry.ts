import { CommandService } from './commandService';
import { BrowserService } from './browserService';
import { FileService } from './fileService';
import { SystemOpenService } from './systemOpenService';

export interface ToolAction {
    name: string;
    description: string;
    params: Record<string, string>;
    handler: (params: any) => Promise<string>;
}

export class ToolRegistry {
    private static tools: Map<string, ToolAction> = new Map();

    static init() {
        this.registerTool({
            name: "execute_command",
            description: "Run a shell command on the system",
            params: { command: "string" },
            handler: async (p) => await CommandService.runCommand(p.command)
        });

        this.registerTool({
            name: "open_browser",
            description: "Open a URL in a headless browser and extract text",
            params: { url: "string" },
            handler: async (p) => await BrowserService.navigateAndExtract(p.url)
        });

        this.registerTool({
            name: "open_url",
            description: "Open a website or search query in the user's visible browser",
            params: { url: "string" },
            handler: async (p) => await SystemOpenService.openUrl(p.url)
        });

        this.registerTool({
            name: "open_app",
            description: "Open a desktop application on the user's computer",
            params: { appName: "string" },
            handler: async (p) => await SystemOpenService.openApp(p.appName)
        });

        this.registerTool({
            name: "update_system",
            description: "Open the operating system's software update settings",
            params: {},
            handler: async () => await SystemOpenService.openSystemUpdate()
        });

        this.registerTool({
            name: "read_file",
            description: "Read a file from the workspace",
            params: { filePath: "string" },
            handler: async (p) => await FileService.readFile(p.filePath)
        });

        this.registerTool({
            name: "write_file",
            description: "Write content to a file in the workspace",
            params: { filePath: "string", content: "string" },
            handler: async (p) => await FileService.writeFile(p.filePath, p.content)
        });
    }

    private static registerTool(tool: ToolAction) {
        this.tools.set(tool.name, tool);
    }

    static getTool(name: string): ToolAction | undefined {
        return this.tools.get(name);
    }

    static getAvailableTools(): Omit<ToolAction, 'handler'>[] {
        return Array.from(this.tools.values()).map(({ name, description, params }) => ({
            name, description, params
        }));
    }
}

// Initialize tools
ToolRegistry.init();
