import React, { useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { useWindowManager, WindowState } from './WindowManager';
import { useKernel } from './kernel/KernelContext';
import { Minus, X, Maximize2 } from 'lucide-react';

export function WindowFrame({ windowState }: { windowState: WindowState }) {
  const { id, title, component, isOpen, isMinimized, isMaximized, zIndex, width, height, x, y } = windowState;
  const { focusApp, closeApp, minimizeApp, maximizeApp, updateAppPosition, updateAppSize } = useWindowManager();
  const dragControls = useDragControls();
  const kernel = useKernel();

  // Snapping state
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | null>(null);

  if (!isOpen || isMinimized) return null;

  const handleDrag = (e: any, info: any) => {
    // Detect edge proximity for snap preview
    const { clientX, clientY } = info.point;
    const screenW = window.innerWidth;

    if (clientY < 10) {
      setSnapPreview('top');
    } else if (clientX < 20) {
      setSnapPreview('left');
    } else if (clientX > screenW - 20) {
      setSnapPreview('right');
    } else {
      setSnapPreview(null);
    }
  };

  const handleDragEnd = (e: any, info: any) => {
    const { clientX, clientY } = info.point;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    setSnapPreview(null);

    // Apply snap if near edges
    if (clientY < 10) {
      maximizeApp(id);
    } else if (clientX < 20) {
      // Snap Left
      if (isMaximized) maximizeApp(id); // unmaximize if needed
      updateAppPosition(id, 0, 32);
      updateAppSize(id, '50vw', 'calc(100vh - 100px)');
    } else if (clientX > screenW - 20) {
      // Snap Right
      if (isMaximized) maximizeApp(id);
      updateAppPosition(id, screenW / 2, 32);
      updateAppSize(id, '50vw', 'calc(100vh - 100px)');
    } else {
      // Normal drag
      updateAppPosition(id, x + info.offset.x, y + info.offset.y);
    }
  };

  return (
    <>
      {/* Snap Preview Overlay */}
      {snapPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-0 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: snapPreview === 'top' ? 32 : snapPreview === 'left' || snapPreview === 'right' ? 32 : 32,
            left: snapPreview === 'left' ? 0 : snapPreview === 'right' ? '50vw' : 0,
            width: snapPreview === 'top' ? '100vw' : '50vw',
            height: 'calc(100vh - 100px)',
          }}
        />
      )}

      <motion.div
        drag={!isMaximized}
        dragControls={dragControls}
        dragListener={false} // Only drag via controls (the header)
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: kernel.antigravityMode && !isMaximized ? [x - 8, x + 8, x - 8] : (isMaximized ? 0 : x),
          y: kernel.antigravityMode && !isMaximized ? [y - 12, y + 12, y - 12] : (isMaximized ? 32 : y),
          width: isMaximized ? '100vw' : width,
          height: isMaximized ? 'calc(100vh - 100px)' : height
        }}
        transition={
          kernel.antigravityMode && !isMaximized
            ? {
                x: { repeat: Infinity, duration: 9, ease: "easeInOut" },
                y: { repeat: Infinity, duration: 7, ease: "easeInOut" },
                type: 'spring', stiffness: 300, damping: 30
              }
            : { type: 'spring', stiffness: 300, damping: 30 }
        }
        onPointerDown={() => focusApp(id)}
        className={`absolute overflow-hidden rounded-xl border flex flex-col transition-colors duration-[2000ms] ${
          kernel.antigravityMode 
            ? 'border-cyan-400/40 bg-[#001020]/40 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,245,212,0.15)]' 
            : 'border-[#00F5D4]/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-[#030014]/80'
        }`}
        style={{ zIndex }}
      >
        {/* Title Bar (Drag Handle) */}
        <div 
          className="h-10 flex items-center px-4 bg-white/5 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={(e) => {
              focusApp(id);
              dragControls.start(e);
          }}
          onDoubleClick={() => maximizeApp(id)}
        >
          <div className="flex items-center space-x-2 mr-4">
            <button onClick={(e) => { e.stopPropagation(); closeApp(id); }} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center group transition-colors">
              <X className="w-2.5 h-2.5 text-red-900 opacity-0 group-hover:opacity-100" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); minimizeApp(id); }} className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center group transition-colors">
              <Minus className="w-2.5 h-2.5 text-yellow-900 opacity-0 group-hover:opacity-100" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); maximizeApp(id); }} className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center group transition-colors">
              <Maximize2 className="w-2.5 h-2.5 text-green-900 opacity-0 group-hover:opacity-100" />
            </button>
          </div>
          <div className="flex-1 text-center text-[13px] font-semibold text-white/70 tracking-wide">
            {title}
          </div>
          <div className="w-14"></div> {/* spacer for centering */}
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-hidden relative">
          {component}
        </div>
      </motion.div>
    </>
  );
}
