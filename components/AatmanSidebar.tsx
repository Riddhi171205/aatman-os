import React from 'react';
import { 
  Activity, 
  BrainCircuit, 
  Database, 
  LineChart, 
  ListTodo, 
  Terminal, 
  ScrollText,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { id: 'overview', icon: Activity, label: 'Overview' },
  { id: 'pipeline', icon: Network, label: 'Pipeline' },
  { id: 'memory', icon: Database, label: 'Memory' },
  { id: 'analytics', icon: LineChart, label: 'Analytics' },
  { id: 'planner', icon: ListTodo, label: 'Planner' },
  { id: 'execution', icon: Terminal, label: 'Execution' },
  { id: 'logs', icon: ScrollText, label: 'Logs' },
];

export function AatmanSidebar() {
  const [active, setActive] = React.useState('overview');

  return (
    <div className="w-16 md:w-64 h-full alien-glass flex flex-col border-r border-[#00F5D4]/20 z-20">
      <div className="p-4 md:p-6 flex items-center justify-center md:justify-start border-b border-[#00F5D4]/10 mb-4">
        <BrainCircuit className="w-8 h-8 text-primary glow-text-primary" />
        <span className="hidden md:block ml-3 font-bold tracking-widest text-white">AATMAN OS</span>
      </div>

      <nav className="flex-1 px-2 md:px-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                'w-full flex items-center justify-center md:justify-start p-3 rounded-lg transition-all duration-200 group',
                isActive 
                  ? 'bg-primary/10 border border-primary/30 shadow-[0_0_10px_rgba(0,245,212,0.1)] text-primary' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'glow-text-primary')} />
              <span className="hidden md:block ml-3 text-sm font-medium tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#00F5D4]/10">
        <div className="hidden md:flex items-center justify-between text-xs text-muted-foreground">
          <span>STATUS</span>
          <span className="text-primary glow-text-primary animate-pulse">NOMINAL</span>
        </div>
      </div>
    </div>
  );
}
