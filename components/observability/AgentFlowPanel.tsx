import React from 'react';
import { useAatman } from '../AatmanContext';
import { BrainCircuit, Search, Code2, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentFlowPanel() {
    const { telemetry } = useAatman();
    const flow = telemetry.agentFlow;

    const steps = [
        { id: 'planner', label: 'Planner Agent', icon: BrainCircuit, status: flow.planner },
        { id: 'research', label: 'Research Agent', icon: Search, status: flow.research },
        { id: 'coder', label: 'Execution / Coder', icon: Code2, status: flow.coder },
    ];

    const getStatusStyle = (status: string) => {
        if (status === 'completed') return 'bg-green-500/20 border-green-500/50 text-green-400';
        if (status === 'running') return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 border-dashed animate-pulse';
        return 'bg-primary/5 border-primary/20 text-primary/40';
    };

    return (
        <div className="flex flex-col h-full bg-black/40 border-l border-border font-mono text-xs">
            <div className="p-3 border-b border-border bg-primary/5 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <span className="uppercase tracking-widest font-bold text-primary">Multi-Agent Flow</span>
            </div>

            <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <motion.div 
                            initial={{ opacity: 0.5, scale: 0.9 }}
                            animate={{ opacity: 1, scale: step.status === 'running' ? 1.05 : 1 }}
                            className={`w-full max-w-[200px] border p-4 rounded-sm flex flex-col items-center gap-3 transition-colors ${getStatusStyle(step.status)}`}
                        >
                            <step.icon className={`w-6 h-6 ${step.status === 'completed' ? 'text-green-400' : step.status === 'running' ? 'text-yellow-400' : 'text-primary/40'}`} />
                            <span className="uppercase tracking-widest font-bold text-[10px] text-center">
                                {step.label}
                                <br />
                                <span className="opacity-60 text-[8px]">{step.status}</span>
                            </span>
                        </motion.div>

                        {idx < steps.length - 1 && (
                            <ArrowDown className={`w-4 h-4 ${steps[idx].status === 'completed' ? 'text-green-500/50' : 'text-primary/20'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
