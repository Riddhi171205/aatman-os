import React from 'react';
import { useAatman } from '../AatmanContext';
import { Activity, Database, Cpu, Wifi } from 'lucide-react';

export default function SystemStatusBar() {
    const { telemetry } = useAatman();

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Idle': return 'text-primary/50';
            case 'Thinking': return 'text-yellow-400 animate-pulse';
            case 'Executing Tool': return 'text-purple-400 animate-pulse';
            case 'Retrieving Memory': return 'text-blue-400 animate-pulse';
            case 'Listening': return 'text-red-500 animate-pulse';
            default: return 'text-primary animate-pulse';
        }
    };

    return (
        <header className="h-10 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-4 z-50 relative">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-primary/80 uppercase">AATMAN_CORE_ONLINE</span>
                </div>
                
                <div className="h-4 w-px bg-primary/20" />
                
                <div className="flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${getStageColor(telemetry.stage)}`} />
                    <span className={`text-[10px] font-mono tracking-widest uppercase ${getStageColor(telemetry.stage)}`}>
                        STATE: {telemetry.stage}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-primary/60">
                    <Cpu className="w-3 h-3" />
                    <span className="text-[9px] font-mono tracking-widest uppercase">MODEL: {telemetry.activeModel}</span>
                </div>
                
                <div className="flex items-center gap-2 text-primary/60">
                    <Database className="w-3 h-3" />
                    <span className="text-[9px] font-mono tracking-widest uppercase">LATENCY: {telemetry.latencyMs > 0 ? `${telemetry.latencyMs}ms` : '--'}</span>
                </div>

                <div className="flex items-center gap-2 text-primary/60">
                    <Wifi className="w-3 h-3" />
                    <span className="text-[9px] font-mono tracking-widest uppercase">NETWORK: STABLE</span>
                </div>
            </div>
        </header>
    );
}
