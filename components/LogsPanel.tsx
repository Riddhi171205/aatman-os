import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { SystemLog } from './AatmanContext';

export default function LogsPanel({ logs }: { logs: SystemLog[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="min-h-0 flex-1 flex flex-col">
            <div className="h-12 shrink-0 border-b border-cyan-300/10 flex items-center gap-2 px-4">
                <Terminal className="h-4 w-4 text-cyan-200/70" />
                <span className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/60">System Logs</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-2">
                {logs.length === 0 ? (
                    <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/30">Awaiting events...</div>
                ) : logs.map(log => (
                    <div key={log.id} className="rounded-md border border-cyan-300/10 bg-black/20 p-2 text-[10px] leading-relaxed">
                        <div className="mb-1 flex items-center justify-between text-cyan-100/35">
                            <span>[{log.scope}]</span>
                            <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div className="text-cyan-50/75">{log.message}</div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
