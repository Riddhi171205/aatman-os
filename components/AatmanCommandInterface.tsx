import React from 'react';
import { Terminal, Upload, Play, Clock, Youtube, Activity, Loader2 } from 'lucide-react';
import { AlienGlassCard } from './ui/AlienGlassCard';

interface CommandProps {
  command: string;
  setCommand: (val: string) => void;
  onExecute: (e?: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

export function AatmanCommandInterface({ command, setCommand, onExecute, onFileUpload, isProcessing }: CommandProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    // If the command is empty or we are currently processing, do nothing
    if (!command.trim() || isProcessing) return;

    // Set a timer to execute the command after 1.5 seconds of no typing
    const timer = setTimeout(() => {
      onExecute();
    }, 1500);

    // Clear the timer if the user keeps typing before 1.5 seconds is up
    return () => clearTimeout(timer);
  }, [command, isProcessing, onExecute]);

  const quickActions = [
    { label: 'Status', icon: Activity, cmd: 'status' },
    { label: 'Open YouTube', icon: Youtube, cmd: 'open YouTube' },
    { label: 'What time is it', icon: Clock, cmd: 'what time is it' },
  ];

  return (
    <AlienGlassCard className="flex flex-col space-y-4">
      <div className="flex items-center space-x-2 text-white mb-2">
        <Terminal className="w-4 h-4 text-primary glow-text-primary" />
        <h3 className="text-sm font-bold tracking-widest uppercase">Command Console</h3>
      </div>

      <form onSubmit={onExecute} className={`relative flex items-center transition-all duration-300 rounded-lg bg-[#000000]/40 border ${isFocused ? 'border-primary shadow-[0_0_15px_rgba(0,245,212,0.3)]' : 'border-primary/20'}`}>
        <span className="pl-4 text-primary font-mono text-sm">{'>'}</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onExecute();
            }
          }}
          disabled={isProcessing}
          placeholder={isProcessing ? "PROCESSING..." : "Auto-executes when you stop typing..."}
          className="flex-1 bg-transparent border-none outline-none text-sm text-white font-mono p-4 placeholder:text-primary/30 disabled:opacity-50"
        />
        <div className="flex items-center space-x-2 pr-2">
          <label className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-mono tracking-widest transition-colors">
            <Upload className="w-3 h-3" />
            <span>FILE</span>
            <input type="file" className="hidden" onChange={onFileUpload} disabled={isProcessing} />
          </label>
          <button 
            type="submit" 
            disabled={!command.trim() || isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-primary hover:bg-white text-black font-bold text-xs tracking-widest transition-colors shadow-[0_0_10px_rgba(0,245,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            <span>EXEC</span>
          </button>
        </div>
      </form>

      <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-[#00F5D4]/10">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setCommand(action.cmd);
              // Small delay to ensure state updates before execution
              setTimeout(() => onExecute(), 50);
            }}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary/80 hover:text-primary transition-all text-[10px] font-mono tracking-widest disabled:opacity-50"
          >
            <action.icon className="w-3 h-3" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </AlienGlassCard>
  );
}
