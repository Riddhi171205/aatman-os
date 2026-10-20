import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CircleDot } from 'lucide-react';
import { AIState } from './AatmanContext';

const stateConfig: Record<AIState, { label: string; glow: string; ring: string; scale: number; speed: number }> = {
    idle: {
        label: 'Idle',
        glow: 'rgba(125, 229, 255, 0.30)',
        ring: 'border-cyan-200/20',
        scale: 1,
        speed: 4
    },
    listening: {
        label: 'Listening',
        glow: 'rgba(34, 211, 238, 0.50)',
        ring: 'border-cyan-200/50',
        scale: 1.05,
        speed: 1.6
    },
    thinking: {
        label: 'Thinking',
        glow: 'rgba(96, 165, 250, 0.48)',
        ring: 'border-blue-300/45',
        scale: 1.03,
        speed: 1.2
    },
    executing: {
        label: 'Executing',
        glow: 'rgba(250, 204, 21, 0.32)',
        ring: 'border-amber-200/45',
        scale: 1.07,
        speed: 0.9
    },
    responding: {
        label: 'Responding',
        glow: 'rgba(52, 211, 153, 0.42)',
        ring: 'border-emerald-200/45',
        scale: 1.04,
        speed: 1.4
    }
};

export default function AICore({ state, latencyMs }: { state: AIState; latencyMs: number }) {
    const config = stateConfig[state];

    return (
        <div className="rounded-lg border border-cyan-300/15 bg-white/[0.035] backdrop-blur-xl p-5 shadow-[0_0_50px_rgba(0,240,255,0.07)]">
            <div className="relative h-64 flex items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.11),transparent_58%)]">
                {[1, 1.25, 1.5].map((scale, index) => (
                    <motion.div
                        key={scale}
                        className={`absolute h-32 w-32 rounded-full border ${config.ring}`}
                        animate={{ scale: [scale, scale + 0.45], opacity: [0.38, 0] }}
                        transition={{ duration: config.speed + index * 0.25, repeat: Infinity, ease: 'easeOut', delay: index * 0.28 }}
                    />
                ))}

                <motion.div
                    className="absolute h-56 w-56 rounded-full border border-cyan-300/18"
                    animate={{ rotate: 360 }}
                    transition={{ duration: state === 'executing' ? 8 : 18, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute h-44 w-44 rounded-full border border-blue-300/16"
                    animate={{ rotate: -360 }}
                    transition={{ duration: state === 'thinking' ? 7 : 14, repeat: Infinity, ease: 'linear' }}
                />

                <motion.div
                    className="relative h-28 w-28 rounded-full bg-gradient-to-br from-cyan-100 via-cyan-400 to-blue-500 flex items-center justify-center"
                    animate={{ scale: [1, config.scale, 1], boxShadow: [`0 0 34px ${config.glow}`, `0 0 72px ${config.glow}`, `0 0 34px ${config.glow}`] }}
                    transition={{ duration: config.speed, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <div className="h-20 w-20 rounded-full bg-[#061219] border border-white/25 flex items-center justify-center">
                        <Brain className="h-9 w-9 text-cyan-50" />
                    </div>
                </motion.div>

                <div className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[0.25em] text-cyan-100/55">AI Core</div>
                <div className="absolute top-5 right-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-cyan-100/70">
                    <CircleDot className="h-3 w-3 text-emerald-300" />
                    {config.label}
                </div>
                <div className="absolute bottom-5 right-5 text-[10px] uppercase tracking-[0.18em] text-cyan-100/45">
                    {latencyMs ? `${latencyMs}ms` : 'Realtime'}
                </div>
            </div>
        </div>
    );
}
