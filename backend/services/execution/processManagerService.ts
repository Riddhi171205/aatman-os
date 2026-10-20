import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface ProcessInfo {
    pid: number;
    name: string;
    memory: string;
    cpu: string;
    platform: string;
    status?: string;
}

export interface ProcessStatus {
    success: boolean;
    message: string;
    pid?: number;
    timestamp: string;
}

export interface ProcessMonitorResult {
    pid: number;
    running: boolean;
    lastChecked: string;
}

export class ProcessManagerService {
    private static platform = os.platform();
    private static processMonitors: Map<number, NodeJS.Timeout> = new Map();

    /**
     * Gets a list of running processes
     */
    static async getProcessList(): Promise<ProcessInfo[]> {
        console.log(`[ProcessManagerService] Fetching process list`);
        try {
            if (this.platform === 'win32') {
                // Windows
                const { stdout } = await execAsync('tasklist /FO CSV /NH /V');
                const lines = stdout.trim().split('\n');
                return lines
                    .map(line => {
                        const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
                        return {
                            pid: parseInt(parts[1]) || 0,
                            name: parts[0],
                            memory: parts[4] || 'N/A',
                            cpu: parts[8] || 'N/A',
                            platform: 'windows',
                            status: parts[7] || 'Unknown',
                        };
                    })
                    .filter(p => p.pid > 0);
            } else if (this.platform === 'darwin') {
                // macOS
                const { stdout } = await execAsync('ps aux');
                const lines = stdout.trim().split('\n').slice(1);
                return lines
                    .map(line => {
                        const parts = line.split(/\s+/);
                        return {
                            pid: parseInt(parts[1]) || 0,
                            name: parts[10] || 'unknown',
                            memory: `${parts[5]}KB` || 'N/A',
                            cpu: `${parts[2]}%` || 'N/A',
                            platform: 'darwin',
                        };
                    })
                    .filter(p => p.pid > 0);
            } else {
                // Linux
                const { stdout } = await execAsync('ps aux');
                const lines = stdout.trim().split('\n').slice(1);
                return lines
                    .map(line => {
                        const parts = line.split(/\s+/);
                        return {
                            pid: parseInt(parts[1]) || 0,
                            name: parts[10] || 'unknown',
                            memory: `${parts[5]}KB` || 'N/A',
                            cpu: `${parts[2]}%` || 'N/A',
                            platform: 'linux',
                        };
                    })
                    .filter(p => p.pid > 0);
            }
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to get process list: ${error.message}`);
            return [];
        }
    }

    /**
     * Kills a process by PID
     */
    static async killProcess(pid: number, force: boolean = false): Promise<ProcessStatus> {
        console.log(`[ProcessManagerService] Killing process: ${pid} (force: ${force})`);
        try {
            if (pid <= 0) {
                throw new Error('Invalid PID: must be greater than 0');
            }

            let command = '';

            if (this.platform === 'win32') {
                const forceFlag = force ? '/F' : '';
                command = `taskkill /PID ${pid} ${forceFlag}`;
            } else if (this.platform === 'darwin') {
                const signal = force ? '-KILL' : '-TERM';
                command = `kill ${signal} ${pid}`;
            } else {
                const signal = force ? '-9' : '-15';
                command = `kill ${signal} ${pid}`;
            }

            await execAsync(command);
            console.log(`[ProcessManagerService] Successfully killed process: ${pid}`);

            // Clear any monitors
            if (this.processMonitors.has(pid)) {
                const timer = this.processMonitors.get(pid);
                if (timer) clearInterval(timer);
                this.processMonitors.delete(pid);
            }

            return {
                success: true,
                message: `Process ${pid} terminated successfully`,
                pid,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to kill process: ${error.message}`);
            return {
                success: false,
                message: `Failed to terminate process: ${error.message}`,
                pid,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Kills a process by application name
     */
    static async killProcessByName(appName: string, force: boolean = false): Promise<ProcessStatus> {
        console.log(`[ProcessManagerService] Killing process by name: ${appName} (force: ${force})`);
        try {
            let command = '';

            if (this.platform === 'win32') {
                const forceFlag = force ? '/F' : '';
                command = `taskkill /IM ${appName}.exe ${forceFlag}`;
            } else if (this.platform === 'darwin') {
                const signal = force ? '-KILL' : '-TERM';
                command = `pkill ${signal} -i "${appName}"`;
            } else {
                const signal = force ? '-9' : '-15';
                command = `pkill ${signal} -i "${appName}"`;
            }

            await execAsync(command);
            console.log(`[ProcessManagerService] Successfully killed process: ${appName}`);

            return {
                success: true,
                message: `Process '${appName}' terminated successfully`,
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to kill process by name: ${error.message}`);
            return {
                success: false,
                message: `Failed to terminate process: ${error.message}`,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Gets detailed process information
     */
    static async getProcessInfo(pid: number): Promise<ProcessInfo | null> {
        console.log(`[ProcessManagerService] Fetching process info for PID: ${pid}`);
        try {
            if (pid <= 0) {
                throw new Error('Invalid PID: must be greater than 0');
            }

            if (this.platform === 'win32') {
                const { stdout } = await execAsync(`tasklist /FO CSV /NH /V /FI "PID eq ${pid}"`);
                const line = stdout.trim();
                if (!line) return null;

                const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
                return {
                    pid,
                    name: parts[0],
                    memory: parts[4] || 'N/A',
                    cpu: parts[8] || 'N/A',
                    platform: 'windows',
                    status: parts[7] || 'Unknown',
                };
            } else if (this.platform === 'darwin') {
                const { stdout } = await execAsync(`ps -p ${pid} -o pid,comm,%cpu,%mem`);
                const lines = stdout.trim().split('\n');
                if (lines.length < 2) return null;

                const parts = lines[1].split(/\s+/);
                return {
                    pid,
                    name: parts[1] || 'unknown',
                    memory: `${parts[3]}%` || 'N/A',
                    cpu: `${parts[2]}%` || 'N/A',
                    platform: 'darwin',
                };
            } else {
                const { stdout } = await execAsync(`ps -p ${pid} -o pid,comm,%cpu,%mem`);
                const lines = stdout.trim().split('\n');
                if (lines.length < 2) return null;

                const parts = lines[1].split(/\s+/);
                return {
                    pid,
                    name: parts[1] || 'unknown',
                    memory: `${parts[3]}%` || 'N/A',
                    cpu: `${parts[2]}%` || 'N/A',
                    platform: 'linux',
                };
            }
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to get process info: ${error.message}`);
            return null;
        }
    }

    /**
     * Monitors a process status
     */
    static monitorProcess(pid: number, callback: (result: ProcessMonitorResult) => void, interval: number = 5000): void {
        console.log(`[ProcessManagerService] Starting process monitor for PID: ${pid}`);

        const timer = setInterval(async () => {
            const info = await this.getProcessInfo(pid);
            callback({
                pid,
                running: info !== null,
                lastChecked: new Date().toISOString(),
            });

            if (info === null) {
                console.log(`[ProcessManagerService] Process ${pid} no longer running, stopping monitor`);
                clearInterval(timer);
                this.processMonitors.delete(pid);
            }
        }, interval);

        this.processMonitors.set(pid, timer);
    }

    /**
     * Gets all PIDs for a specific application
     */
    static async getAllAppPids(appName: string): Promise<number[]> {
        console.log(`[ProcessManagerService] Getting all PIDs for app: ${appName}`);
        try {
            let command = '';
            let pids: number[] = [];

            if (this.platform === 'win32') {
                command = `tasklist /FO CSV /NH`;
                const { stdout } = await execAsync(command);
                const lines = stdout.trim().split('\n');
                pids = lines
                    .filter(line => line.toLowerCase().includes(appName.toLowerCase()))
                    .map(line => {
                        const parts = line.split(',');
                        return parseInt(parts[1]) || 0;
                    })
                    .filter(pid => pid > 0);
            } else if (this.platform === 'darwin' || this.platform === 'linux') {
                command = `pgrep -f "${appName}"`;
                try {
                    const { stdout } = await execAsync(command);
                    pids = stdout
                        .trim()
                        .split('\n')
                        .map(pid => parseInt(pid))
                        .filter(pid => pid > 0);
                } catch {
                    pids = [];
                }
            }

            console.log(`[ProcessManagerService] Found ${pids.length} process(es) for ${appName}`);
            return pids;
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to get app PIDs: ${error.message}`);
            return [];
        }
    }

    /**
     * Gets memory usage of a process
     */
    static async getMemoryUsage(pid: number): Promise<string> {
        console.log(`[ProcessManagerService] Getting memory usage for PID: ${pid}`);
        try {
            if (this.platform === 'win32') {
                const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH /V`);
                const parts = stdout.trim().split(',');
                return parts[4]?.replace(/"/g, '') || 'N/A';
            } else if (this.platform === 'darwin' || this.platform === 'linux') {
                const { stdout } = await execAsync(`ps -p ${pid} -o %mem=`);
                return `${stdout.trim()}%`;
            }
            return 'N/A';
        } catch (error: any) {
            console.error(`[ProcessManagerService] Failed to get memory usage: ${error.message}`);
            return 'N/A';
        }
    }
}