import React from 'react';
import { useAatman } from '../AatmanContext';
import { Terminal, Code, Server, CheckCircle2, CircleDashed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolExecutionPanel() {
    const { telemetry } = useAatman();

    return (
        <div className="flex flex-col h-full bg-black/40 border-l border-border font-mono text-xs">
            <div className="p-3 border-b border-border bg-primary/5 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="uppercase tracking-widest font-bold text-primary">Tool Execution Log</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {telemetry.toolsExecution.length === 0 ? (
                        <div className="text-primary/40 text-[10px] uppercase tracking-widest text-center mt-10">
                            Awaiting tool execution...
                        </div>
                    ) : (
                        telemetry.toolsExecution.map((tool, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-primary/20 bg-card/50 rounded-sm overflow-hidden"
                            >
                                <div className="p-2 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Server className="w-3 h-3" />
                                        <span className="font-bold tracking-wider">{tool.name}</span>
                                    </div>
                                    {tool.status === 'running' ? (
                                        <CircleDashed className="w-3 h-3 text-yellow-400 animate-spin" />
                                    ) : tool.status === 'success' ? (
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                    )}
                                </div>
                                <div className="p-3 text-[10px] space-y-2">
                                    <div className="text-primary/70">
                                        <span className="text-purple-400">PARAMS:</span> {JSON.stringify(tool.params)}
                                    </div>
                                    {tool.output && (
                                        <div className="text-primary/90 whitespace-pre-wrap mt-2 p-2 bg-black/50 border border-primary/10">
                                            <span className="text-green-400 block mb-1">OUTPUT:</span>
                                            {tool.output.length > 300 ? tool.output.substring(0, 300) + '...' : tool.output}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
