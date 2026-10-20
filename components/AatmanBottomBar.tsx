import React from 'react';
import { ShieldCheck, Wifi } from 'lucide-react';

export function AatmanBottomBar() {
  return (
    <footer className="h-8 border-t border-[#00F5D4]/20 alien-glass flex items-center justify-between px-4 z-10 w-full text-[10px] md:text-xs font-mono tracking-wider">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SYSTEM HEALTH: EXCELLENT</span>
        </div>
      </div>

      <div className="hidden md:block text-center flex-1 text-muted-foreground opacity-50">
        NEURAL PROCESSING ACTIVE
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-secondary">
          <Wifi className="w-3.5 h-3.5" />
          <span>CONNECTION: SECURE</span>
        </div>
        <div className="text-muted-foreground border-l border-primary/20 pl-4">
          v3.1.0-ALN
        </div>
      </div>
    </footer>
  );
}
