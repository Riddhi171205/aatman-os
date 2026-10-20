import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Search, Command } from 'lucide-react';
import { useAatman } from '../AatmanContext';

export function TopMenuBar() {
  const [time, setTime] = useState(new Date());
  const { telemetry } = useAatman();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[100] text-[13px] font-medium text-white/90 select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
          <Command className="w-4 h-4 text-primary" />
          <span className="font-bold tracking-wide">AATMAN OS</span>
        </div>
        <div className="hidden md:flex space-x-4 text-white/70">
          <span className="cursor-pointer hover:text-white">File</span>
          <span className="cursor-pointer hover:text-white">Edit</span>
          <span className="cursor-pointer hover:text-white">View</span>
          <span className="cursor-pointer hover:text-white">AI</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 bg-black/30 rounded-full px-3 py-1 border border-white/10">
          <Search className="w-3 h-3 text-white/50" />
          <span className="text-white/50 text-xs">Nexus</span>
        </div>

        <div className="flex items-center space-x-3 text-white/80">
          <span className="flex items-center space-x-1.5 text-xs bg-[#00F5D4]/10 text-primary px-2 py-0.5 rounded-full border border-[#00F5D4]/20">
            <span className={`w-1.5 h-1.5 rounded-full ${telemetry.aiState === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
            <span>AATMAN {telemetry.aiState === 'idle' ? 'Active' : telemetry.aiState}</span>
          </span>
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
