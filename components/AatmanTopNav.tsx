import React from 'react';
import { Settings, LogOut, User, BrainCircuit } from 'lucide-react';
import { useAatman } from './AatmanContext';

export type ChatEngine = 'llm' | 'brain';

interface AatmanTopNavProps {
  user?: any;
  onLogout?: () => void;
  engine?: ChatEngine;
  onEngineChange?: (engine: ChatEngine) => void;
  brainOnline?: boolean | null;
}

export function AatmanTopNav({ user, onLogout, engine = 'llm', onEngineChange, brainOnline = null }: AatmanTopNavProps) {
  const { telemetry } = useAatman();
  const brainLabel = brainOnline === null ? 'CHECKING' : brainOnline ? 'ONLINE' : 'OFFLINE';
  const brainDot = brainOnline ? 'bg-[#00F5D4] shadow-[0_0_8px_rgba(0,245,212,0.6)]' : 'bg-muted-foreground/40';

  return (
    <header className="h-16 border-b border-[#00F5D4]/20 alien-glass flex items-center justify-between px-6 z-10 w-full">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
          <span className="text-sm font-medium tracking-widest text-green-400">ONLINE</span>
        </div>
        <div className="hidden md:flex items-center text-xs text-muted-foreground font-mono tracking-wider">
          <span className="opacity-50 mr-2">SESSION_ID:</span>
          <span className="text-primary/70">AATMAN-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 font-mono text-[10px] tracking-widest">
          <div className="flex items-center space-x-1.5" title={`AATMAN Brain: ${brainLabel}`}>
            <BrainCircuit className="w-3.5 h-3.5 text-primary/70" />
            <span className={`w-1.5 h-1.5 rounded-full ${brainDot}`} />
            <span className="hidden lg:inline text-muted-foreground">BRAIN_{brainLabel}</span>
          </div>
          {onEngineChange && (
            <div className="flex items-center rounded-full border border-primary/20 overflow-hidden" role="group" aria-label="Chat engine">
              {(['llm', 'brain'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onEngineChange(option)}
                  disabled={option === 'brain' && !brainOnline}
                  aria-pressed={engine === option}
                  className={`px-2 py-0.5 uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${engine === option ? 'bg-primary text-black' : 'text-primary/70 hover:text-primary'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">{user?.username || 'GUEST_USER'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
