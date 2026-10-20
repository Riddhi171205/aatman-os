import React from 'react';
import { useAatman } from '../AatmanContext';
import { Eye, FileText, ChevronDown } from 'lucide-react';

export default function PromptInspector() {
    const { telemetry } = useAatman();
    const prompt = telemetry.promptContext;

    if (!prompt) {
        return (
            <div className="flex flex-col h-full bg-black/40 border-l border-border font-mono text-xs items-center justify-center text-primary/40 p-6 text-center">
                <Eye className="w-8 h-8 mb-4 opacity-20" />
                <p className="uppercase tracking-widest">Awaiting Prompt Compilation</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black/40 border-l border-border font-mono text-xs overflow-hidden">
            <div className="p-3 border-b border-border bg-primary/5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="uppercase tracking-widest font-bold text-primary">Prompt Inspector</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* User Input */}
                <div>
                    <h3 className="text-primary font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ChevronDown className="w-3 h-3" /> User Intent
                    </h3>
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-sm text-primary/80 italic">
                        "{prompt.userQuery}"
                    </div>
                </div>

                {/* Retrieved Context */}
                <div>
                    <h3 className="text-primary font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-blue-400">
                        <ChevronDown className="w-3 h-3" /> Injected Context (RAG)
                    </h3>
                    {prompt.retrievedMemory.length > 0 ? (
                        <div className="space-y-2">
                            {prompt.retrievedMemory.map((mem, idx) => (
                                <div key={idx} className="bg-blue-500/10 border border-blue-500/30 p-2 rounded-sm text-blue-300 text-[10px]">
                                    {mem.text}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-primary/40 italic text-[10px]">No relevant past context found.</div>
                    )}
                </div>

                {/* System Prompt */}
                <div>
                    <h3 className="text-primary font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-red-400">
                        <ChevronDown className="w-3 h-3" /> Final Compiled System Prompt
                    </h3>
                    <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-sm text-red-300/80 text-[9px] whitespace-pre-wrap leading-relaxed">
                        {prompt.systemPrompt}
                    </div>
                </div>

            </div>
        </div>
    );
}
