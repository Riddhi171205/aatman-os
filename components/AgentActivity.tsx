import { Activity, Terminal, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AgentActivity() {
  const agents = [
      { name: "Orchestrator", status: "Active", task: "Routing queries" },
      { name: "Planner", status: "Standby", task: "Awaiting complex instruction" },
      { name: "Researcher", status: "Indexing", task: "Updating vector store" },
      { name: "Coder", status: "Idle", task: "None" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative p-6">
        <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
            <div>
                <span className="text-[10px] font-bold text-primary/80 uppercase">SYSTEM_ORCHESTRATOR</span>
                <h1 className="text-xl font-bold tracking-tighter uppercase font-mono mt-1">Multi-Agent Control</h1>
            </div>
            <div className="text-[10px] space-x-4 uppercase font-bold tracking-widest text-primary/60">
                <span>Total: 04</span>
                <span className="text-primary animate-pulse">Running: 01</span>
                <span>Standby: 03</span>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {agents.map(a => (
                <div key={a.name} className="p-4 border border-border bg-card/30 flex flex-col justify-between h-32 relative group">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary group-hover:w-full group-hover:h-full transition-all duration-500 opacity-50 z-0"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <h3 className="font-mono text-sm tracking-widest uppercase text-primary font-bold">{a.name}</h3>
                        <div className={`w-2 h-2 ${a.status === 'Active' ? 'bg-primary shadow-[0_0_8px_rgba(0,240,255,1)] animate-pulse' : a.status === 'Standby' ? 'bg-green-500/50' : 'bg-primary/20'}`} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[9px] text-primary/60 uppercase mb-1">STATUS: {a.status}</div>
                        <div className="text-xs font-mono text-primary/90 truncate">{a.task}</div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex-1 border border-border bg-card/10 flex flex-col overflow-hidden min-h-0 relative">
            <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50 text-[10px] font-mono text-primary/80 uppercase tracking-widest font-bold">
                <Terminal className="w-3 h-3 text-primary" /> SYSTEM_LOGS
            </div>
            <div className="absolute top-0 right-0 p-3 opacity-20">
                <div className="text-[9px] font-mono tracking-[0.4em] text-primary">AATMAN_TELEMETRY</div>
            </div>
            <ScrollArea className="flex-1 p-4 bg-background/50">
                <div className="space-y-2 font-mono text-xs">
                    <div className="text-primary/60">{">"} [System] AATMAN OS Intialized. Sequence running.</div>
                    <div className="text-primary font-bold">{">"} [Orchestrator] Registered 3 child agents successfully.</div>
                    <div className="text-primary/60">{">"} [Planner] Loaded capabilities.</div>
                    <div className="text-primary/60 opacity-50">...</div>
                    <div className="text-primary/90">{">"} <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500/80" /> [Researcher] Qdrant connection verified.</div>
                    <div className="text-primary/90">{">"} <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500/80" /> [Coder] Ollama context bounds set to 8192.</div>
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
