import React, { useState } from 'react';
import { Folder, FileText, Image as ImageIcon, Search, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

export function FileExplorer() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPath, setCurrentPath] = useState('Home');

  const sidebarItems = [
    { label: 'Home', icon: Folder },
    { label: 'Downloads', icon: Folder },
    { label: 'Projects', icon: Folder },
    { label: 'Recents', icon: FileText },
    { label: 'iDrive', icon: Folder },
  ];

  const files = [
    { name: 'Documents', type: 'folder' },
    { name: 'Downloads', type: 'folder' },
    { name: 'Projects', type: 'folder' },
    { name: 'Music', type: 'folder' },
    { name: 'Desktop', type: 'folder', isTerminal: true },
    { name: 'Project Folder', type: 'folder' },
    { name: 'Mac', type: 'folder' },
    { name: 'Videos', type: 'folder' },
    { name: 'Initc.trd', type: 'file' },
    { name: 'Reference doc.pdf', type: 'file' },
  ];

  return (
    <div className="flex h-full w-full text-white bg-transparent">
      {/* Sidebar */}
      <div className="w-48 bg-black/20 border-r border-white/5 p-4 flex flex-col space-y-2">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/0" /> {/* Spacers for traffic lights since they are in header */}
        </div>
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setCurrentPath(item.label)}
            className={`flex items-center space-x-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
              currentPath === item.label ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black/10">
        {/* Toolbar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm font-medium">{currentPath}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-black/30 rounded-md px-3 py-1.5 border border-white/10">
              <Search className="w-4 h-4 text-white/50 mr-2" />
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/50 w-32"
              />
            </div>
            <div className="flex items-center bg-black/30 rounded-md border border-white/10 p-0.5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white/20 shadow' : 'hover:bg-white/10'}`}
              >
                <LayoutGrid className="w-4 h-4 text-white/80" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white/20 shadow' : 'hover:bg-white/10'}`}
              >
                <List className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6">
              {files.map((file, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  {file.type === 'folder' ? (
                    <div className="relative">
                      <Folder className="w-16 h-16 text-blue-400 drop-shadow-md group-hover:scale-105 transition-transform" fill="currentColor" fillOpacity={0.2} strokeWidth={1} />
                      {file.isTerminal && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white bg-black px-1 rounded border border-white/20">{'>_'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <FileText className="w-16 h-16 text-gray-300 drop-shadow-md group-hover:scale-105 transition-transform" strokeWidth={1} />
                  )}
                  <span className="mt-2 text-xs text-center text-white/80 group-hover:text-white truncate w-full px-1">{file.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              {files.map((file, i) => (
                <div key={i} className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/5 cursor-pointer group">
                  {file.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-blue-400" fill="currentColor" fillOpacity={0.2} />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-white/80 group-hover:text-white">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
