import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface AppOptions {
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    detached?: boolean;
}

export interface AppStatus {
    success: boolean;
    message: string;
    appName: string;
    timestamp: string;
}

export interface RunningApp {
    name: string;
    pid: number;
    platform: string;
}

export class AppManagementService {
    private static platform = os.platform();
    private static runningApps: Map<string, number[]> = new Map();

    static async openApp(appName: string, options?: AppOptions): Promise<AppStatus> {
        console.log(`[AppManagementService] Opening app: ${appName}`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                command = `start "" "${appName}"`;
                if (options?.args?.length) {
                    command += ` ${options.args.map(arg => `"${arg}"`).join(' ')}`;
                }
            } else if (this.platform === 'darwin') {
                command = `open -a "${appName}"`;
                if (options?.args?.length) {
                    command += ` --args ${options.args.map(arg => `"${arg}"`).join(' ')}`;
                }
            } else {
                command = `${appName}`;
                if (options?.args?.length) {
                    command += ` ${options.args.map(arg => `"${arg}"`).join(' ')}`;
                }
                command += ' &';
            }

            await execAsync(command, {
                env: { ...process.env, ...options?.env },
                cwd: options?.cwd,
            });

            console.log(`[AppManagementService] Successfully opened: ${appName}`);
            return {
                success: true,
                message: `Application '${appName}' opened successfully`,
                appName,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to open app: ${error.message}`);
            return {
                success: false,
                message: `Failed to open application: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }

    static async closeApp(appName: string, force: boolean = false): Promise<AppStatus> {
        console.log(`[AppManagementService] Closing app: ${appName} (force: ${force})`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                const forceFlag = force ? '/F' : '';
                command = `taskkill /IM ${appName.endsWith('.exe') ? appName : `${appName}.exe`} ${forceFlag}`.trim();
            } else if (this.platform === 'darwin') {
                const forceFlag = force ? '-KILL' : '';
                command = `pkill ${forceFlag} -i "${appName}"`.trim();
            } else {
                const forceFlag = force ? '-9' : '-15';
                command = `pkill ${forceFlag} -i "${appName}"`;
            }

            await execAsync(command);

            console.log(`[AppManagementService] Successfully closed: ${appName}`);
            this.runningApps.delete(appName);

            return {
                success: true,
                message: `Application '${appName}' closed successfully`,
                appName,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to close app: ${error.message}`);
            return {
                success: false,
                message: `Failed to close application: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }

    static async restartApp(appName: string): Promise<AppStatus> {
        console.log(`[AppManagementService] Restarting app: ${appName}`);
        try {
            const closeResult = await this.closeApp(appName, true);
            if (!closeResult.success) {
                throw new Error(`Failed to close app during restart: ${closeResult.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            return await this.openApp(appName);
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to restart app: ${error.message}`);
            return {
                success: false,
                message: `Failed to restart application: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }

    static async getRunningApps(): Promise<RunningApp[]> {
        console.log(`[AppManagementService] Fetching running applications`);
        try {
            if (this.platform === 'win32') {
                const { stdout } = await execAsync('tasklist /FO CSV /NH');
                return stdout
                    .trim()
                    .split('\n')
                    .map(line => {
                        const parts = line.split(',').map(p => p.replace(/"/g, ''));
                        return {
                            name: parts[0],
                            pid: parseInt(parts[1]) || 0,
                            platform: 'windows',
                        };
                    })
                    .filter(app => app.pid > 0);
            }

            const { stdout } = await execAsync('ps aux');
            return stdout
                .trim()
                .split('\n')
                .slice(1)
                .map(line => {
                    const parts = line.split(/\s+/);
                    return {
                        name: parts[10] || 'unknown',
                        pid: parseInt(parts[1]) || 0,
                        platform: this.platform === 'darwin' ? 'darwin' : 'linux',
                    };
                })
                .filter(app => app.pid > 0);
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to get running apps: ${error.message}`);
            return [];
        }
    }

    static async appExists(appName: string): Promise<boolean> {
        console.log(`[AppManagementService] Checking if app exists: ${appName}`);
        try {
            const command = this.platform === 'win32'
                ? `where ${appName}`
                : this.platform === 'darwin'
                    ? `which ${appName} || mdfind -name "${appName}.app" | head -1`
                    : `which ${appName}`;

            try {
                await execAsync(command);
                console.log(`[AppManagementService] App exists: ${appName}`);
                return true;
            } catch {
                console.log(`[AppManagementService] App not found: ${appName}`);
                return false;
            }
        } catch (error: any) {
            console.error(`[AppManagementService] Error checking app existence: ${error.message}`);
            return false;
        }
    }

    static async bringToFront(appName: string): Promise<AppStatus> {
        console.log(`[AppManagementService] Bringing app to front: ${appName}`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                command = `powershell -Command "Add-Type @' using System; using System.Runtime.InteropServices; public class Win { [DllImport(\\"user32.dll\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); } '@; $proc = Get-Process ${appName.replace('.exe', '')} -ErrorAction SilentlyContinue | Select-Object -First 1; if($proc) { [Win]::SetForegroundWindow($proc.MainWindowHandle) }"`;
            } else if (this.platform === 'darwin') {
                command = `osascript -e 'tell application "${appName}" to activate'`;
            } else {
                command = `wmctrl -a "${appName}"`;
            }

            await execAsync(command);

            console.log(`[AppManagementService] Brought app to front: ${appName}`);
            return {
                success: true,
                message: `Application '${appName}' brought to foreground`,
                appName,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to bring app to front: ${error.message}`);
            return {
                success: false,
                message: `Failed to bring application to foreground: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }

    static async minimize(appName: string): Promise<AppStatus> {
        console.log(`[AppManagementService] Minimizing app: ${appName}`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                command = `powershell -Command "Add-Type @' using System; using System.Runtime.InteropServices; public class Win { [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); } '@; $proc = Get-Process ${appName.replace('.exe', '')} -ErrorAction SilentlyContinue | Select-Object -First 1; if($proc) { [Win]::ShowWindow($proc.MainWindowHandle, 6) }"`;
            } else if (this.platform === 'darwin') {
                command = `osascript -e 'tell application "${appName}" to set visible of every window to false'`;
            } else {
                command = `wmctrl -l | grep ${appName} | awk '{print $1}' | xargs -I {} wmctrl -i -r {} -b add,hidden`;
            }

            await execAsync(command);

            console.log(`[AppManagementService] Minimized app: ${appName}`);
            return {
                success: true,
                message: `Application '${appName}' minimized`,
                appName,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to minimize app: ${error.message}`);
            return {
                success: false,
                message: `Failed to minimize application: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }

    static async maximize(appName: string): Promise<AppStatus> {
        console.log(`[AppManagementService] Maximizing app: ${appName}`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                command = `powershell -Command "Add-Type @' using System; using System.Runtime.InteropServices; public class Win { [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); } '@; $proc = Get-Process ${appName.replace('.exe', '')} -ErrorAction SilentlyContinue | Select-Object -First 1; if($proc) { [Win]::ShowWindow($proc.MainWindowHandle, 3) }"`;
            } else if (this.platform === 'darwin') {
                command = `osascript -e 'tell application "${appName}" to set bounds of every window to (0, 0, 1920, 1080)'`;
            } else {
                command = `wmctrl -l | grep ${appName} | awk '{print $1}' | xargs -I {} wmctrl -i -r {} -b add,maximized_vert,maximized_horz`;
            }

            await execAsync(command);

            console.log(`[AppManagementService] Maximized app: ${appName}`);
            return {
                success: true,
                message: `Application '${appName}' maximized`,
                appName,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[AppManagementService] Failed to maximize app: ${error.message}`);
            return {
                success: false,
                message: `Failed to maximize application: ${error.message}`,
                appName,
                timestamp: new Date().toISOString(),
            };
        }
    }
}