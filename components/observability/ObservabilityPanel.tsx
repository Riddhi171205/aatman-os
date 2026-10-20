import React, { useState } from 'react';
import AgentFlowPanel from './AgentFlowPanel';
import PromptInspector from './PromptInspector';
import ToolExecutionPanel from './ToolExecutionPanel';

export default function ObservabilityPanel() {
    const [activeTab, setActiveTab] = useState<'prompt' | 'agent' | 'tools'>('prompt');

    return (
        <div className="h-full flex flex-col border-l border-border bg-card/30 backdrop-blur">
            <div className="flex border-b border-border text-[9px] uppercase tracking-widest font-mono font-bold">
                <button 
                    onClick={() => setActiveTab('prompt')}
                    className={`flex-1 p-3 transition-colors ${activeTab === 'prompt' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-primary/50 hover:bg-primary/5'}`}
                >
                    Prompt
                </button>
                <button 
                    onClick={() => setActiveTab('agent')}
                    className={`flex-1 p-3 transition-colors ${activeTab === 'agent' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-primary/50 hover:bg-primary/5'}`}
                >
                    Agent Flow
                </button>
                <button 
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 p-3 transition-colors ${activeTab === 'tools' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-primary/50 hover:bg-primary/5'}`}
                >
                    Tools
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'prompt' && <PromptInspector />}
                {activeTab === 'agent' && <AgentFlowPanel />}
                {activeTab === 'tools' && <ToolExecutionPanel />}
            </div>
        </div>
    );
}
