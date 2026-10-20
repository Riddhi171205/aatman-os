import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWindowManager } from './WindowManager';
import { Cpu, FolderOpen, Settings, LayoutGrid, Terminal, Globe, BrainCircuit, LineChart } from 'lucide-react';

// Apps
import { FileExplorer } from './apps/FileExplorer';
import { SystemCore } from './apps/SystemCore';
import { TerminalApp } from './apps/TerminalApp';
// We will wrap existing components like AatmanAnalyticsGrid into OS Windows
import { AatmanAnalyticsGrid } from '../AatmanAnalyticsGrid';
import { AatmanMemorySection } from '../AatmanMemorySection';
import { AatmanAICore } from '../AatmanAICore';

export function Dock() {
  const { openApp, windows } = useWindowManager();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const apps = [
    {
      id: 'file-explorer',
      title: 'File Explorer',
      icon: FolderOpen,
      color: 'bg-blue-500',
      component: <FileExplorer />,
    },
    {
      id: 'browser',
      title: 'Nexus Browser',
      icon: Globe,
      color: 'bg-cyan-500',
      component: <div className="p-8 text-white">Browser coming soon...</div>,
    },
    {
      id: 'ai-core',
      title: 'AI Core Log',
      icon: BrainCircuit,
      color: 'bg-purple-500',
      component: <AatmanAICore />,
    },
    {
      id: 'system-core',
      title: 'System Core',
      icon: Cpu,
      color: 'bg-teal-500',
      component: <SystemCore />,
    },
    {
      id: 'analytics',
      title: 'System Analytics',
      icon: LineChart,
      color: 'bg-green-500',
      component: <div className="p-4 h-full"><AatmanAnalyticsGrid /></div>,
    },
    {
      id: 'memory',
      title: 'Neural Memory',
      icon: LayoutGrid,
      color: 'bg-yellow-500',
      component: <div className="p-4 h-full"><AatmanMemorySection /></div>,
    },
    {
      id: 'terminal',
      title: 'Terminal',
      icon: Terminal,
      color: 'bg-gray-700',
      component: <TerminalApp />,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      color: 'bg-slate-500',
      component: <div className="p-8 text-white">Settings coming soon...</div>,
    }
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100]">
      <div className="flex items-end space-x-2 px-3 pb-2 pt-3 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {apps.map((app, index) => {
          const isHovered = hoveredIndex === index;
          const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;
          const isOpen = windows.some(w => w.id === app.id);
          
          let scale = 1;
          if (isHovered) scale = 1.3;
          else if (isNeighbor) scale = 1.1;

          return (
            <div key={app.id} className="relative flex flex-col items-center group">
              <motion.button
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => openApp({ id: app.id, title: app.title, component: app.component })}
                animate={{ scale, y: isHovered ? -10 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${app.color} relative z-10 overflow-hidden`}
              >
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <app.icon className="w-6 h-6 text-white drop-shadow-md" />
              </motion.button>
              
              {/* App Label Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-12 px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded-lg whitespace-nowrap border border-white/10 shadow-xl pointer-events-none"
                  >
                    {app.title}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Running Indicator */}
              <div className={`absolute -bottom-1.5 w-1 h-1 rounded-full transition-all duration-300 ${isOpen ? 'bg-white/80' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
