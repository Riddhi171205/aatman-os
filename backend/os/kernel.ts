import { EventEmitter } from 'events';
import { rolePermissions, Permission } from './permissions';

export class OSKernel extends EventEmitter {
    private modules: Record<string, any> = {};

    registerModule(name: string, module: any) {
        this.modules[name] = module;
        this.emit('module-registered', name);
    }

    getModule<T>(name: string): T | undefined {
        return this.modules[name];
    }

    // Example: Task queue for background jobs
    private taskQueue: (() => Promise<void>)[] = [];

    addTask(task: () => Promise<void>) {
        this.taskQueue.push(task);
    }

    async runAllTasks() {
        while (this.taskQueue.length) {
            const task = this.taskQueue.shift();
            if (task) await task();
        }
    }

    checkPermission(role: string, permission: Permission): boolean {
        return (
            rolePermissions[role]?.includes(permission) ||
            rolePermissions[role]?.includes('admin:all')
        );
    }
}

export const osKernel = new OSKernel();