import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';
import { PipelineStep } from './AatmanContext';

const statusClasses = {
    pending: 'border-cyan-300/10 text-cyan-100/35 bg-white/[0.025]',
    active: 'border-cyan-200/40 text-cyan-50 bg-cyan-300/10 shadow-[0_0_22px_rgba(0,240,255,0.12)]',
    complete: 'border-emerald-300/25 text-emerald-100/80 bg-emerald-300/8'
};

export default function ActivityPanel({ steps }: { steps: PipelineStep[] }) {
    return (
        <div className="p-4 border-b border-cyan-300/10">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/60">Pipeline</h2>
                <span className="text-[9px] uppercase tracking-[0.18em] text-cyan-100/35">Live</span>
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        layout
                        className={`relative rounded-lg border p-3 transition-colors ${statusClasses[step.status]}`}
                    >
                        {index < steps.length - 1 && (
                            <div className="absolute left-[22px] top-10 h-5 w-px bg-cyan-300/15" />
                        )}
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full border border-current/40 flex items-center justify-center">
                                {step.status === 'complete' && <Check className="h-3 w-3" />}
                                {step.status === 'active' && <Loader2 className="h-3 w-3 animate-spin" />}
                                {step.status === 'pending' && <Circle className="h-2 w-2" />}
                            </div>
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.18em]">{step.label}</div>
                                <div className="mt-1 text-[9px] uppercase tracking-[0.16em] opacity-50">{step.status}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
