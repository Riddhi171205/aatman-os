import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export interface Process {
  pid: number;
  name: string;
  memoryAllocated: number; // MB
}

export interface KernelLog {
  id: string;
  status: string;
  msg: string;
  time: string;
}

export interface HardwareTelemetry {
  gpu: number;
  npu: number;
  storage: number;
  net: number;
  cpuThreads: number[];
}

interface KernelContextType {
  processes: Process[];
  logs: KernelLog[];
  telemetry: HardwareTelemetry;
  totalMemory: number; // MB
  usedMemory: number; // MB
  spawnProcess: (name: string, memoryNeeded?: number) => number;
  killProcess: (pid: number) => void;
  emitLog: (status: string, msg: string) => void;
  setAIActivity: (isActive: boolean) => void;
  antigravityMode: boolean;
  setAntigravityMode: (isActive: boolean) => void;
}

const KernelContext = createContext<KernelContextType | undefined>(undefined);

export const KernelProvider = ({ children }: { children: ReactNode }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [logs, setLogs] = useState<KernelLog[]>([]);
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    gpu: 5, npu: 2, storage: 1, net: 0, cpuThreads: Array(32).fill(5)
  });
  
  const totalMemory = 16384; // 16GB simulated
  const kernelMemory = 2048; // OS base
  const [aiActive, setAiActive] = useState(false);
  const [antigravityMode, setAntigravityMode] = useState(false);

  const pidCounter = useRef(1000);

  const emitLog = (status: string, msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(), status, msg, time }]);
  };

  const spawnProcess = (name: string, memoryNeeded = Math.floor(Math.random() * 500) + 100) => {
    const pid = pidCounter.current++;
    setProcesses(prev => [...prev, { pid, name, memoryAllocated: memoryNeeded }]);
    emitLog('SYS_EXEC', `Allocated ${memoryNeeded}MB for process ${name} [PID: ${pid}]`);
    return pid;
  };

  const killProcess = (pid: number) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    emitLog('SYS_KILL', `Terminated process [PID: ${pid}] and freed memory`);
  };

  // Hardware Simulation Loop
  useEffect(() => {
    emitLog('KERNEL', 'AATMAN OS v2.0 Kernel Initialized');
    spawnProcess('WindowServer', 450);
    spawnProcess('AudioCore', 120);

    const tick = setInterval(() => {
      setTelemetry(prev => {
        // Calculate base load based on processes
        const processCount = processes.length;
        const targetCpu = Math.min(100, 5 + (processCount * 2));
        
        const newThreads = prev.cpuThreads.map(val => {
           let target = targetCpu;
           if (aiActive) target += Math.random() * 60; // AI spikes threads
           target += (Math.random() * 20 - 10);
           return Math.max(5, Math.min(100, val + (target - val) * 0.5));
        });

        return {
          gpu: aiActive ? Math.min(100, prev.gpu + Math.random() * 40 + 20) : Math.max(5, prev.gpu - 5 + Math.random() * 10),
          npu: aiActive ? Math.min(100, prev.npu + Math.random() * 50 + 40) : Math.max(1, prev.npu - 10),
          storage: Math.max(1, Math.min(100, (Math.random() * processCount * 5))),
          net: aiActive ? Math.random() * 80 + 20 : Math.random() * 10,
          cpuThreads: newThreads
        };
      });
    }, 500);

    return () => clearInterval(tick);
  }, [processes.length, aiActive]);

  const usedMemory = kernelMemory + processes.reduce((acc, p) => acc + p.memoryAllocated, 0);

  return (
    <KernelContext.Provider value={{
      processes,
      logs,
      telemetry,
      totalMemory,
      usedMemory,
      spawnProcess,
      killProcess,
      emitLog,
      setAIActivity: setAiActive,
      antigravityMode,
      setAntigravityMode
    }}>
      {children}
    </KernelContext.Provider>
  );
};

export const useKernel = () => {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error("useKernel must be used within KernelProvider");
  return ctx;
};
