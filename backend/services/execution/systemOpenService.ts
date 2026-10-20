import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const appAliases: Record<string, string> = {
    browser: 'Google Chrome',
    chrome: 'Google Chrome',
    googlechrome: 'Google Chrome',
    safari: 'Safari',
    firefox: 'Firefox',
    terminal: 'Terminal',
    calculator: 'Calculator',
    calendar: 'Calendar',
    mail: 'Mail',
    messages: 'Messages',
    notes: 'Notes',
    music: 'Music',
    spotify: 'Spotify',
    whatsapp: 'WhatsApp',
    vscode: 'Visual Studio Code',
    code: 'Visual Studio Code'
};

const winAppAliases: Record<string, string> = {
    browser: 'chrome',
    chrome: 'chrome',
    googlechrome: 'chrome',
    safari: 'chrome',
    firefox: 'firefox',
    terminal: 'wt',
    calculator: 'calc',
    calendar: 'outlook',
    mail: 'outlook',
    messages: 'explorer',
    notes: 'notepad',
    music: 'wmplayer',
    spotify: 'spotify',
    whatsapp: 'whatsapp',
    vscode: 'code',
    code: 'code'
};

const siteAliases: Record<string, string> = {
    google: 'https://www.google.com',
    youtube: 'https://www.youtube.com',
    gmail: 'https://mail.google.com',
    github: 'https://github.com',
    chatgpt: 'https://chatgpt.com',
    netflix: 'https://www.netflix.com',
    instagram: 'https://www.instagram.com',
    twitter: 'https://x.com',
    x: 'https://x.com',
    facebook: 'https://www.facebook.com',
    linkedin: 'https://www.linkedin.com',
    reddit: 'https://www.reddit.com',
    amazon: 'https://www.amazon.com'
};

export class SystemOpenService {
    static normalizeUrl(rawUrl: string): string {
        const input = rawUrl.trim();
        const lowerInput = input.toLowerCase();

        if (siteAliases[lowerInput]) {
            return siteAliases[lowerInput];
        }

        if (/^https?:\/\//i.test(input)) {
            return input;
        }

        if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) {
            return `https://${input}`;
        }

        return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }

    static normalizeAppName(rawAppName: string, platform: NodeJS.Platform): string {
        const compactName = rawAppName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (platform === 'win32') {
            return winAppAliases[compactName] || rawAppName.trim();
        }
        return appAliases[compactName] || rawAppName.trim();
    }

    static async openUrl(rawUrl: string): Promise<string> {
        const url = this.normalizeUrl(rawUrl);
        const platform = os.platform();
        try {
            if (platform === 'darwin') {
                await execFileAsync('open', [url]);
            } else if (platform === 'win32') {
                await execAsync(`start "" "${url}"`);
            } else {
                await execFileAsync('xdg-open', [url]);
            }
            return `Opened ${url}`;
        } catch (error: any) {
            console.error('Failed to open URL:', error);
            return `Failed to open ${url}: ${error.message}`;
        }
    }

    static async openApp(rawAppName: string): Promise<string> {
        const platform = os.platform();
        const appName = this.normalizeAppName(rawAppName, platform);
        try {
            if (platform === 'darwin') {
                await execFileAsync('open', ['-a', appName]);
            } else if (platform === 'win32') {
                await execAsync(`start "" "${appName}"`);
            } else {
                const linuxAppName = appName.toLowerCase().replace(/\s+/g, '-');
                await execFileAsync(linuxAppName, []);
            }
            return `Opened ${appName}`;
        } catch (error: any) {
            console.error('Failed to open App:', error);
            return `Failed to open ${appName}: ${error.message}`;
        }
    }

    static async openSystemUpdate(): Promise<string> {
        const platform = os.platform();

        try {
            if (platform === 'darwin') {
                await execFileAsync('open', ['x-apple.systempreferences:com.apple.Software-Update-Settings.extension']);
                return 'Opened Software Update settings';
            }

            if (platform === 'win32') {
                await execAsync('start "" "ms-settings:windowsupdate"');
                return 'Opened Windows Update settings';
            }

            const linuxUpdateManagers = [
                { command: 'gnome-software', args: ['--mode=updates'] },
                { command: 'update-manager', args: [] },
                { command: 'software-properties-gtk', args: ['--open-tab=2'] },
            ];

            let lastError: any = null;
            for (const manager of linuxUpdateManagers) {
                try {
                    await execFileAsync(manager.command, manager.args);
                    return 'Opened system update manager';
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('No supported update manager was found.');
        } catch (error: any) {
            console.error('Failed to open system update settings:', error);
            return `Failed to open system update settings: ${error.message}`;
        }
    }
}
