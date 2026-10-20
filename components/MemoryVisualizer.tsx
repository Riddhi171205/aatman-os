import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Search, BrainCircuit, Network, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAatman } from './AatmanContext';

export default function MemoryVisualizer({ userId, compact = false }: { userId: string, compact?: boolean }) {
  const [memories, setMemories] = useState<any[]>([]);
  const { telemetry } = useAatman();

  useEffect(() => {
    if (userId) {
        api.getMemories(userId).then(res => {
            if (res && res.matches) {
                // Map the matches to the format expected by the visualizer
                setMemories(res.matches.map((m: any) => ({
                    id: m.id || Math.random().toString(),
                    memoryText: m.payload ? m.payload.content : m.content || "Unknown Memory",
                    createdAt: m.payload ? m.payload.timestamp : Date.now()
                })));
            } else if (Array.isArray(res)) {
                setMemories(res);
            } else {
                setMemories([]);
            }
        }).catch(err => {
            console.error("Failed to load memories", err);
            setMemories([]);
        });
    }
  }, [userId]);

  if (compact) {
    const activeMemories = telemetry.promptContext?.retrievedMemory?.length
      ? telemetry.promptContext.retrievedMemory.map((memory: any, index: number) => ({
          id: `active-${index}`,
          memoryText: memory.text || memory.content || String(memory)
        }))
      : memories.slice(0, 5);

    return (
      <div className="rounded-lg border border-cyan-300/15 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/60">Memory</span>
          <BrainCircuit className="h-4 w-4 text-cyan-200/70" />
        </div>
        <div className="flex flex-wrap gap-2">
          {activeMemories.length === 0 ? (
            <span className="rounded-full border border-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100/35">No active memory</span>
          ) : activeMemories.map((memory: any, index: number) => (
            <span
              key={memory.id}
              className={`max-w-full truncate rounded-full border px-3 py-1 text-[10px] tracking-[0.08em] ${index === 0 ? 'border-cyan-200/35 bg-cyan-300/10 text-cyan-50' : 'border-cyan-300/12 bg-white/[0.03] text-cyan-100/55'}`}
              title={memory.memoryText}
            >
              {memory.memoryText}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative p-6">
        <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
            <div>
                <span className="text-[10px] font-bold text-primary/80 uppercase">VECTOR_EMBEDDINGS</span>
                <h1 className="text-xl font-bold tracking-tighter uppercase font-mono mt-1">Memory Core Sync</h1>
            </div>
            <div className="text-[10px] space-x-4 uppercase font-bold tracking-widest text-primary/60">
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-primary" /> Qdrant Status: OK</span>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
            {/* Visualizer Mock */}
            <div className="md:col-span-2 border border-border bg-card/10 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 z-0 technical-grid opacity-30" />
                <Network className="w-48 h-48 text-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000" />
                
                {/* Simulated Nodes */}
                {memories.map((m, i) => {
                    const top = 20 + Math.random() * 60;
                    const left = 20 + Math.random() * 60;
                    return (
                        <div 
                            key={m.id} 
                            style={{ top: `${top}%`, left: `${left}%` }}
                            className="absolute w-2 h-2 bg-primary shadow-[0_0_10px_rgba(0,240,255,0.8)] z-10 hover:scale-[3] transition-all cursor-crosshair group/node"
                        >
                            <div className="absolute top-4 left-0 w-48 p-2 bg-[#050505] border border-primary/50 text-[10px] font-mono text-primary opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none z-20">
                                {m.memoryText}
                            </div>
                        </div>
                    );
                })}

                <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-mono uppercase tracking-widest text-primary/60 border border-primary/20 bg-black/50 p-2">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-primary shrink-0 animate-pulse" /> Live Nodes: {memories.length}</span>
                </div>
            </div>

            {/* List */}
            <div className="border border-border bg-card/10 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border bg-card/50 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold font-mono tracking-widest uppercase text-primary/80">Indexed Truths</h3>
                    <span className="text-[9px] px-1 border border-primary/30 text-primary">{memories.length}</span>
                </div>
                <ScrollArea className="flex-1 p-4 bg-background/50">
                    <div className="space-y-4">
                        {memories.map(m => (
                            <div key={m.id} className="p-3 bg-primary/5 border-l-2 border-l-primary border-y border-r border-border text-xs font-mono relative group">
                                <div className="absolute top-0 right-0 w-1 h-3 bg-primary/40"></div>
                                <p className="mb-2 text-primary/90 leading-relaxed font-bold">{m.memoryText}</p>
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] text-primary/70 uppercase tracking-widest">Score: {Math.floor(Math.random() * 5) + 5}/10</p>
                                    <span className="text-[9px] text-primary/40">[{new Date(m.createdAt || Date.now()).toLocaleTimeString()}]</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    </div>
  );
}
