import React from 'react';
import { Database, ChevronRight } from 'lucide-react';
import { AlienGlassCard } from './ui/AlienGlassCard';

export function AatmanMemorySection() {
  // We'll mock the memory data here to match the spec empty state
  const memories: any[] = [];

  return (
    <AlienGlassCard className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-[#00F5D4]/10 pb-2">
        <div className="flex items-center space-x-2 text-white">
          <Database className="w-4 h-4 text-secondary glow-text-secondary" />
          <h3 className="text-sm font-bold tracking-widest uppercase">Memory Bank</h3>
        </div>
        <button className="text-[10px] text-primary hover:text-white transition-colors flex items-center font-mono tracking-widest">
          VIEW ALL <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 border border-secondary/20">
              <Database className="w-5 h-5 text-secondary/50" />
            </div>
            <p className="text-xs text-muted-foreground font-mono tracking-widest">NO ACTIVE MEMORY</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">System awaiting context</p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {/* Memory items would go here */}
          </div>
        )}
      </div>
    </AlienGlassCard>
  );
}
