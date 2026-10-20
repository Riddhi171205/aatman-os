import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, Terminal } from 'lucide-react';
import { useKernel } from '../kernel/KernelContext';

function CPUScheduler() {
  const kernel = useKernel();
  const threads = kernel.telemetry.cpuThreads;

  return (
    <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B61FF]/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-4 z-10">
        <h3 className="text-xs font-bold tracking-widest text-white/80">CPU SCHEDULER & THREADS</h3>
        <span className="text-[10px] text-white/50 tracking-widest uppercase">Core Utilization</span>
      </div>
      
      <div className="h-32 flex items-end justify-between space-x-1 mb-6 border-b border-white/10 pb-2 z-10">
        {threads.map((val, i) => (
          <motion.div 
            key={i}
            className="w-full rounded-t-sm"
            style={{ 
              backgroundColor: val > 80 ? '#ef4444' : val > 50 ? '#00F5D4' : '#7B61FF',
              opacity: 0.8 
            }}
            animate={{ height: `${val}%` }}
            transition={{ type: 'tween', duration: 0.3 }}
          />
        ))}
      </div>

      <div className="space-y-3 z-10">
        {[
          { label: 'Kernel', color: 'bg-pink-500', val: 10 + (kernel.processes.length * 2) },
          { label: 'AI Engine', color: 'bg-blue-400', val: kernel.telemetry.npu },
          { label: 'Render', color: 'bg-green-400', val: kernel.telemetry.gpu },
          { label: 'Network', color: 'bg-purple-500', val: kernel.telemetry.net }
        ].map(proc => (
          <div key={proc.label} className="flex items-center space-x-3 text-xs">
            <div className={`w-2 h-2 rounded-full ${proc.color}`} />
            <span className="w-20 text-white/60">{proc.label}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${proc.color}`}
                animate={{ width: `${proc.val}%` }}
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoryMap() {
  const kernel = useKernel();
  
  const kernelMem = 2048;
  const userMem = kernel.usedMemory - kernelMem;
  const totalMem = kernel.totalMemory;
  const freeMem = totalMem - kernel.usedMemory;

  const kPct = (kernelMem / totalMem) * 100;
  const uPct = (userMem / totalMem) * 100;
  const fPct = (freeMem / totalMem) * 100;

  return (
    <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-bl from-[#00F5D4]/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-4 z-10">
        <h3 className="text-xs font-bold tracking-widest text-white/80">MEMORY ALLOCATION MAP</h3>
      </div>
      
      {/* Visual Heatmap */}
      <div className="h-12 w-full border border-white/20 rounded-md flex overflow-hidden mb-8 z-10">
        <motion.div className="bg-[#00F5D4]/80 border-r border-black" animate={{ width: `${kPct}%` }} transition={{ type: 'spring' }} />
        <motion.div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-80 border-r border-black" animate={{ width: `${uPct}%` }} transition={{ type: 'spring' }} />
        <motion.div className="bg-white/10" animate={{ width: `${fPct}%` }} transition={{ type: 'spring' }} />
      </div>

      <div className="space-y-4 z-10 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-[#00F5D4]" />
             <span className="text-white/60">Kernel</span>
          </div>
          <span className="text-white/80 font-mono">{(kernelMem / 1024).toFixed(1)} GB</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-purple-500" />
             <span className="text-white/60">User Space</span>
          </div>
          <span className="text-white/80 font-mono">{(userMem / 1024).toFixed(1)} GB</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-white/20" />
             <span className="text-white/60">Free</span>
          </div>
          <span className="text-white/80 font-mono">{(freeMem / 1024).toFixed(1)} GB</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 z-10">
        <span className="text-xs font-mono text-white/50">RAM {(kernel.usedMemory / 1024).toFixed(1)}GB / {(totalMem / 1024).toFixed(0)}GB</span>
        <div className="h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
           <motion.div className="h-full bg-white/50" animate={{ width: `${(kernel.usedMemory / totalMem) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function KernelLogs() {
  const kernel = useKernel();
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [kernel.logs]);

  return (
    <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 z-10 border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <h3 className="text-xs font-bold tracking-widest text-white/80">KERNEL ACTIVITY LOG</h3>
        </div>
      </div>

      <div ref={logsRef} className="flex-1 overflow-y-auto space-y-1 z-10 font-mono text-[10px] scroll-smooth">
        {kernel.logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between py-0.5 hover:bg-white/5 rounded px-1 transition-colors">
            <div className="flex items-center space-x-3">
              <span className={log.status === 'SYS_KILL' ? 'text-red-400 font-bold' : log.status === 'SYS_EXEC' ? 'text-blue-400 font-bold' : 'text-green-400 font-bold'}>{log.status}</span>
              <span className="text-white/70">{log.msg}</span>
            </div>
            <span className="text-white/40">{log.time}</span>
          </div>
        ))}
        <div className="animate-pulse text-green-400 mt-2">_</div>
      </div>
    </div>
  );
}

function HardwareDrivers() {
  const kernel = useKernel();

  const LineGraph = ({ val, color }: { val: number, color: string }) => (
    <div className="h-6 w-32 border-b border-white/10 relative overflow-hidden flex items-end">
       <motion.div 
         className={`w-full ${color} opacity-20`}
         animate={{ height: `${val}%` }}
         transition={{ type: 'spring', bounce: 0.2 }}
       />
       <motion.div 
         className={`absolute bottom-0 w-full h-px ${color.replace('bg-', 'bg-').replace('/20', '')}`}
         animate={{ bottom: `${val}%` }}
         transition={{ type: 'spring', bounce: 0.2 }}
       />
    </div>
  );

  return (
    <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-4 shadow-lg overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 z-10 border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold tracking-widest text-white/80">HARDWARE STATUS</h3>
        </div>
      </div>

      <div className="flex flex-col justify-around flex-1 z-10 text-xs">
         <div className="flex items-center justify-between">
            <span className="text-white/70">GPU</span>
            <LineGraph val={kernel.telemetry.gpu} color="bg-green-400" />
         </div>
         <div className="flex items-center justify-between">
            <span className="text-white/70">NPU</span>
            <LineGraph val={kernel.telemetry.npu} color="bg-purple-500" />
         </div>
         <div className="flex items-center justify-between">
            <span className="text-white/70">Storage</span>
            <LineGraph val={kernel.telemetry.storage} color="bg-gray-400" />
         </div>
         <div className="flex items-center justify-between">
            <span className="text-white/70">Network</span>
            <LineGraph val={kernel.telemetry.net} color="bg-blue-400" />
         </div>
      </div>
    </div>
  );
}

export function SystemCore() {
  return (
    <div className="flex flex-col h-full w-full bg-[#050014]/50 text-white p-6 gap-6 font-sans select-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <div>
             <h2 className="text-[13px] font-bold tracking-widest text-white/90 uppercase">Core Overview :: System Internals - Developer Mode</h2>
           </div>
           <div className="flex space-x-2">
             <div className="px-3 py-1 border border-white/10 rounded-md text-[10px] bg-white/5 uppercase tracking-wider text-white/60">Aura Sans</div>
             <div className="px-3 py-1 border border-white/10 rounded-md text-[10px] bg-white/5 uppercase tracking-wider text-white/60">Smeved</div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            <CPUScheduler />
            <MemoryMap />
            <KernelLogs />
            <HardwareDrivers />
        </div>
    </div>
  );
}
