import React, { useState, useRef, useEffect } from 'react';
import { useKernel } from '../kernel/KernelContext';
import { useAatman } from '../../AatmanContext';
import { api } from '@/lib/api';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'error';
  text: string;
}

export function TerminalApp() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: 'AATMAN OS v2.0 Terminal Environment' },
    { id: '2', type: 'system', text: 'Type "help" for a list of commands.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const kernel = useKernel();
  const { setAIState } = useAatman();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setHistory(prev => [...prev, { id: Math.random().toString(), type, text }]);
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine('input', `root@aatman-os:~# ${trimmed}`);
    const args = trimmed.split(' ');
    const baseCmd = args[0].toLowerCase();

    switch (baseCmd) {
      case 'clear':
        setHistory([]);
        break;
      case 'help':
        addLine('output', 'Available commands:');
        addLine('output', '  clear    - Clear the terminal screen');
        addLine('output', '  help     - Show this help message');
        addLine('output', '  sysinfo  - Display system kernel information');
        addLine('output', '  ps       - List running processes');
        addLine('output', '  echo     - Print text to terminal');
        addLine('output', '  ask      - Send a query to the AATMAN AI');
        addLine('output', '  open     - Open an application (e.g., open calculator)');
        addLine('output', '  update   - Open system update settings');
        break;
      case 'sysinfo':
        addLine('output', `Kernel Memory: ${(kernel.usedMemory / 1024).toFixed(2)} GB / ${(kernel.totalMemory / 1024).toFixed(0)} GB`);
        addLine('output', `Active Processes: ${kernel.processes.length}`);
        addLine('output', `NPU Load: ${kernel.telemetry.npu.toFixed(1)}%`);
        break;
      case 'ps':
        addLine('output', 'PID   | MEMORY   | NAME');
        addLine('output', '----------------------------------');
        kernel.processes.forEach(p => {
          addLine('output', `${p.pid.toString().padEnd(5)} | ${p.memoryAllocated.toString().padEnd(4)} MB | ${p.name}`);
        });
        break;
      case 'echo':
        addLine('output', args.slice(1).join(' '));
        break;
      case 'ask':
        const query = args.slice(1).join(' ');
        if (!query) {
          addLine('error', 'Usage: ask <query>');
          break;
        }
        addLine('system', 'Querying AATMAN AI Core...');
        try {
          kernel.setAIActivity(true);
          const res = await api.sendMessage({ userId: 'terminal', sessionId: 'term-1', message: query });
          addLine('output', `AATMAN: ${res.message}`);
        } catch (e: any) {
          addLine('error', `AI Error: ${e.message}`);
        } finally {
          kernel.setAIActivity(false);
        }
        break;
      case 'open':
        const appName = args.slice(1).join(' ');
        if (!appName) {
          addLine('error', 'Usage: open <app_name>');
          break;
        }
        addLine('system', `Attempting to launch ${appName}...`);
        try {
          const res = await api.executeAction({ action: 'open_app', params: { appName } });
          addLine('output', `System: ${res.result}`);
        } catch (e: any) {
          addLine('error', `Execution Error: ${e.message}`);
        }
        break;
      case 'update':
      case 'upgrade':
        addLine('system', 'Opening system update settings...');
        try {
          const res = await api.executeAction({ action: 'update_system', params: {} });
          addLine('output', `System: ${res.result}`);
        } catch (e: any) {
          addLine('error', `Execution Error: ${e.message}`);
        }
        break;
      default:
        addLine('error', `Command not found: ${baseCmd}`);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(input);
    setInput('');
  };

  return (
    <div 
      className="flex flex-col h-full w-full bg-black text-green-400 font-mono text-sm p-4 overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto space-y-1 pb-4 scroll-smooth">
        {history.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap">
            {line.type === 'input' && <span className="text-white">{line.text}</span>}
            {line.type === 'output' && <span className="text-gray-300">{line.text}</span>}
            {line.type === 'system' && <span className="text-blue-400 font-bold">{line.text}</span>}
            {line.type === 'error' && <span className="text-red-400">{line.text}</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center space-x-2 mt-auto pt-2 border-t border-green-900/30">
        <span className="text-white">root@aatman-os:~#</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-green-400 caret-green-400"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
