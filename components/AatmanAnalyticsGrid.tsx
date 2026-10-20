import React from 'react';
import { AlienGlassCard } from './ui/AlienGlassCard';
import { useAatman } from './AatmanContext';

export function AatmanAnalyticsGrid() {
  const { telemetry } = useAatman();

  const metrics = [
    { label: 'COMMANDS', value: '1,492', change: '+12%', isPositive: true },
    { label: 'ACCURACY', value: '98.7%', change: '+0.2%', isPositive: true },
    { label: 'LATENCY', value: `${telemetry.latencyMs || 42}ms`, change: '-5ms', isPositive: true },
    { label: 'UPTIME', value: '99.99%', change: '0%', isPositive: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, idx) => (
        <AlienGlassCard key={idx} glowOnHover className="p-4 flex flex-col justify-between">
          <div className="text-[10px] text-muted-foreground tracking-widest font-mono mb-2">
            {metric.label}
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-white tracking-wider glow-text-primary">
              {metric.value}
            </div>
            <div className="text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              {metric.change}
            </div>
          </div>
        </AlienGlassCard>
      ))}
    </div>
  );
}
