import React from 'react';
import { motion } from 'motion/react';
import { AlienGlassCard } from './ui/AlienGlassCard';
import { useAatman } from './AatmanContext';

export function AatmanAICore() {
  const { telemetry } = useAatman();
  const isActive = telemetry.aiState !== 'idle';
  
  return (
    <AlienGlassCard className="flex flex-col items-center justify-center p-8 min-h-[300px]">
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-primary/30"
        />
        
        {/* Middle Ring */}
        <motion.div
          animate={{ rotate: -360, scale: isActive ? [1, 1.05, 1] : 1 }}
          transition={{ 
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity }
          }}
          className="absolute inset-2 rounded-full border border-secondary/50 shadow-[0_0_20px_rgba(123,97,255,0.2)]"
        />
        
        {/* Inner Core */}
        <motion.div
          animate={{ scale: isActive ? [0.95, 1.05, 0.95] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-[0_0_40px_rgba(0,245,212,0.6)] flex items-center justify-center relative overflow-hidden"
        >
          {/* Internal core pulsing effect */}
          <div className="absolute inset-0 bg-white/20 blur-md rounded-full mix-blend-overlay" />
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 rounded-full bg-white/40 blur-sm"
          />
        </motion.div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-[0.2em] text-primary glow-text-primary mb-2">
          {isActive ? 'AI CORE ACTIVE' : 'AI CORE STANDBY'}
        </h2>
        <p className="text-sm text-secondary font-mono tracking-widest glow-text-secondary">
          {isActive ? `PROCESSING: ${telemetry.stage.toUpperCase()}` : 'NEURAL PROCESSING STABLE'}
        </p>
      </div>
    </AlienGlassCard>
  );
}
