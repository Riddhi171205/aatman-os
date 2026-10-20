import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Analog clock calculations
  const secondsDegrees = (time.getSeconds() / 60) * 360;
  const minsDegrees = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDegrees = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  return (
    <div className="w-40 h-40 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center relative">
      <div className="relative w-28 h-28 rounded-full border-2 border-white/10 flex items-center justify-center">
        {/* Clock Marks */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-2 bg-white/30 rounded-full"
            style={{ transform: `rotate(${i * 30}deg) translateY(-12px)` }}
          />
        ))}
        {/* Hands */}
        <motion.div 
          className="absolute w-1 h-8 bg-white rounded-full origin-bottom"
          style={{ rotate: hourDegrees, bottom: '50%' }}
        />
        <motion.div 
          className="absolute w-0.5 h-10 bg-white/80 rounded-full origin-bottom"
          style={{ rotate: minsDegrees, bottom: '50%' }}
        />
        <motion.div 
          className="absolute w-0.5 h-12 bg-red-500 rounded-full origin-bottom"
          style={{ rotate: secondsDegrees, bottom: '50%' }}
        />
        <div className="absolute w-2 h-2 bg-red-500 rounded-full z-10" />
      </div>
      <div className="mt-3 text-xs font-medium text-white/80">
        {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

export function SystemMonitorWidget() {
  const [cpu, setCpu] = useState(18);
  const [ram, setRam] = useState(12.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCpu(prev => Math.max(5, Math.min(100, prev + (Math.random() * 10 - 5))));
      setRam(prev => Math.max(8, Math.min(32, prev + (Math.random() * 0.5 - 0.25))));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-40 h-40 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-semibold text-white/90 mb-3">System Monitor</h3>
        
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-white/60 mb-1">
            <span>CPU</span>
            <span>{cpu.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              animate={{ width: `${cpu}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-white/60 mb-1">
            <span>RAM</span>
            <span>{ram.toFixed(1)}GB</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-purple-500"
              animate={{ width: `${(ram / 32) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-white/10 pt-2">
        <span className="text-[10px] text-white/60">Network</span>
        <span className="text-[10px] text-white/90 font-mono">{(Math.random() * 5).toFixed(1)} MB/s</span>
      </div>
    </div>
  );
}
