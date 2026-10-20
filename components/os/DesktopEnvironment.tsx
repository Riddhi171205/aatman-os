import React from 'react';
import { WindowManagerProvider, useWindowManager } from './WindowManager';
import { WindowFrame } from './WindowFrame';
import { TopMenuBar } from './TopMenuBar';
import { Dock } from './Dock';
import { AIAssistantWidget } from './AIAssistantWidget';
import { ClockWidget, SystemMonitorWidget } from './Widgets';
import { KernelProvider, useKernel } from './kernel/KernelContext';

function DesktopContent() {
  const { windows } = useWindowManager();
  const kernel = useKernel();

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans text-foreground select-none transition-colors duration-1000 ${kernel.antigravityMode ? 'bg-[#000510]' : 'bg-[#030014]'}`}>
      {/* Background Ambience */}
      <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-[3000ms] ease-in-out ${kernel.antigravityMode ? 'scale-110 blur-[1px]' : 'scale-100'}`}>
        {/* Dynamic glowing orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#7B61FF]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: kernel.antigravityMode ? '15s' : '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#00F5D4]/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: kernel.antigravityMode ? '25s' : '12s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: kernel.antigravityMode ? '20s' : '10s' }} />

        {/* Antigravity Special Orbs */}
        {kernel.antigravityMode && (
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-[#FF0055]/5 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '22s' }} />
            <div className="absolute bottom-[30%] right-[30%] w-[50vw] h-[50vw] bg-[#00E5FF]/5 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '18s' }} />
          </div>
        )}

        {/* Starfield / Space dust effect */}
        <div className={`absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636918-9ce89bb10732?q=80&w=2000&auto=format&fit=crop')] mix-blend-screen object-cover transition-opacity duration-[3000ms] ${kernel.antigravityMode ? 'opacity-40' : 'opacity-20'}`} />

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>
      
      {/* Antigravity HUD Overlay */}
      {kernel.antigravityMode && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
            <div className="absolute w-[200vw] h-[2px] bg-cyan-500/10 rotate-45 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute w-[200vw] h-[2px] bg-purple-500/10 -rotate-45 animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="absolute inset-0 border-[2px] border-cyan-500/5 m-4 rounded-3xl" />
        </div>
      )}

      <TopMenuBar />

      {/* Desktop Grid / Widgets */}
      <div className="absolute inset-0 pt-12 p-8 z-10 pointer-events-none flex items-start justify-end space-x-6">
        <div className="pointer-events-auto space-y-6">
          <ClockWidget />
          <SystemMonitorWidget />
        </div>
      </div>

      {/* Windows Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {windows.map((windowState) => (
          <div key={windowState.id} className="pointer-events-auto absolute inset-0">
            <WindowFrame windowState={windowState} />
          </div>
        ))}
      </div>

      <div className="pointer-events-auto">
        <AIAssistantWidget />
      </div>

      <div className="pointer-events-auto">
        <Dock />
      </div>
    </div>
  );
}

export function DesktopEnvironment() {
  return (
    <KernelProvider>
      <WindowManagerProvider>
        <DesktopContent />
      </WindowManagerProvider>
    </KernelProvider>
  );
}
