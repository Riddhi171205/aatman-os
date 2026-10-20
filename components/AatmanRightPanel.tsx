import React from 'react';
import { motion } from 'motion/react';
import { Network, ArrowDown, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { AlienGlassCard } from './ui/AlienGlassCard';
import { useAatman } from './AatmanContext';

export function AatmanRightPanel() {
  const { telemetry } = useAatman();
  const pipeline = telemetry.pipeline;

  return (
    <div className="w-full md:w-80 h-full flex flex-col space-y-4 alien-glass border-l border-[#00F5D4]/20 p-4 z-10 overflow-y-auto">
      <div className="flex items-center space-x-2 text-white mb-2">
        <Network className="w-5 h-5 text-secondary glow-text-secondary" />
        <h3 className="text-sm font-bold tracking-widest uppercase">Activity Pipeline</h3>
      </div>

      <div className="flex-1 flex flex-col space-y-2">
        {pipeline.map((step, index) => {
          const isActive = step.status === 'active';
          const isComplete = step.status === 'complete';
          
          return (
            <React.Fragment key={step.id}>
              <AlienGlassCard 
                variant={isActive ? 'primary' : 'secondary'}
                className={`transition-all duration-500 ${isActive ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(0,245,212,0.2)]' : 'bg-[#0B0F14]/40 border-[#00F5D4]/10 opacity-70'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded bg-black/50 border flex items-center justify-center
                      ${isActive ? 'border-primary text-primary' : isComplete ? 'border-secondary text-secondary' : 'border-white/10 text-white/30'}
                    `}>
                      {isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold tracking-widest uppercase ${isActive ? 'text-primary glow-text-primary' : 'text-white'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[9px] font-mono tracking-widest mt-0.5 text-muted-foreground uppercase">
                        {step.status}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,245,212,0.8)]"
                    />
                  )}
                </div>
              </AlienGlassCard>
              
              {/* Connector line between steps */}
              {index < pipeline.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className={`w-4 h-4 ${isComplete ? 'text-secondary/50' : 'text-white/10'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
