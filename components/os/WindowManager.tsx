import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useKernel } from './kernel/KernelContext';

export type AppId = string;

export interface WindowState {
  id: AppId;
  title: string;
  component: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  width: number | string;
  height: number | string;
  x: number;
  y: number;
  icon?: ReactNode;
  pid?: number; // Kernel process ID
}

interface WindowManagerContextType {
  windows: WindowState[];
  openApp: (app: Partial<WindowState> & { id: AppId; title: string; component: ReactNode }) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  maximizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  updateAppPosition: (id: AppId, x: number, y: number) => void;
  updateAppSize: (id: AppId, width: number | string, height: number | string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const WindowManagerProvider = ({ children }: { children: ReactNode }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [highestZ, setHighestZ] = useState(10);
  const kernel = useKernel();

  const focusApp = (id: AppId) => {
    setHighestZ((prev) => prev + 1);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: highestZ + 1, isMinimized: false } : w))
    );
  };

  const openApp = (app: Partial<WindowState> & { id: AppId; title: string; component: ReactNode }) => {
    setWindows((prev) => {
      const exists = prev.find((w) => w.id === app.id);
      if (exists) {
        focusApp(app.id);
        return prev;
      }
      
      const pid = kernel.spawnProcess(app.title, Math.floor(Math.random() * 800) + 200);
      setHighestZ((z) => z + 1);
      
      return [
        ...prev,
        {
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          width: 800,
          height: 500,
          x: Math.random() * 100 + 50,
          y: Math.random() * 100 + 50,
          zIndex: highestZ + 1,
          pid,
          ...app,
        },
      ];
    });
  };

  const closeApp = (id: AppId) => {
    setWindows((prev) => {
      const w = prev.find(window => window.id === id);
      if (w?.pid) kernel.killProcess(w.pid);
      return prev.filter(window => window.id !== id);
    });
  };

  const minimizeApp = (id: AppId) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  };

  const maximizeApp = (id: AppId) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
    focusApp(id);
  };

  const updateAppPosition = (id: AppId, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  };

  const updateAppSize = (id: AppId, width: number | string, height: number | string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  };

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        openApp,
        closeApp,
        minimizeApp,
        maximizeApp,
        focusApp,
        updateAppPosition,
        updateAppSize,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return context;
};
