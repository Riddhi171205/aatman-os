import React, { createContext, useContext, useState } from 'react';

export type SystemStage = 'Idle' | 'Listening' | 'Transcribing' | 'Thinking' | 'Retrieving Memory' | 'Planning' | 'Executing Tool' | 'Generating Response';
export type AIState = 'idle' | 'listening' | 'thinking' | 'executing' | 'responding';
export type PipelineStatus = 'pending' | 'active' | 'complete';

export interface PipelineStep {
    id: 'input' | 'memory' | 'planner' | 'execution' | 'response';
    label: string;
    status: PipelineStatus;
}

export interface SystemLog {
    id: string;
    scope: 'System' | 'Voice' | 'Memory' | 'Agent' | 'Execution' | 'Response' | 'Brain';
    message: string;
    createdAt: number;
}

export interface TelemetryData {
    stage: SystemStage;
    aiState: AIState;
    activeModel: string;
    latencyMs: number;
    pipeline: PipelineStep[];
    logs: SystemLog[];
    agentFlow: {
        planner: 'pending' | 'running' | 'completed';
        research: 'pending' | 'running' | 'completed';
        coder: 'pending' | 'running' | 'completed';
    };
    toolsExecution: {
        name: string;
        params: any;
        status: 'running' | 'success' | 'error';
        output?: string;
    }[];
    promptContext: {
        systemPrompt: string;
        retrievedMemory: any[];
        userQuery: string;
    } | null;
}

interface AatmanContextType {
    telemetry: TelemetryData;
    updateTelemetry: (updates: Partial<TelemetryData>) => void;
    setAIState: (state: AIState) => void;
    setPipelineStep: (id: PipelineStep['id'], status: PipelineStatus) => void;
    resetPipeline: () => void;
    addLog: (scope: SystemLog['scope'], message: string) => void;
    addToolExecution: (tool: any) => void;
    updateToolExecution: (name: string, updates: any) => void;
    resetTelemetry: () => void;
}

const defaultPipeline: PipelineStep[] = [
    { id: 'input', label: 'User Input', status: 'pending' },
    { id: 'memory', label: 'Memory', status: 'pending' },
    { id: 'planner', label: 'Planner', status: 'pending' },
    { id: 'execution', label: 'Execution', status: 'pending' },
    { id: 'response', label: 'Response', status: 'pending' },
];

const defaultTelemetry: TelemetryData = {
    stage: 'Idle',
    aiState: 'idle',
    activeModel: 'llama3', // Default local model
    latencyMs: 0,
    pipeline: defaultPipeline,
    logs: [],
    agentFlow: {
        planner: 'pending',
        research: 'pending',
        coder: 'pending',
    },
    toolsExecution: [],
    promptContext: null
};

const AatmanContext = createContext<AatmanContextType>({
    telemetry: defaultTelemetry,
    updateTelemetry: () => {},
    setAIState: () => {},
    setPipelineStep: () => {},
    resetPipeline: () => {},
    addLog: () => {},
    addToolExecution: () => {},
    updateToolExecution: () => {},
    resetTelemetry: () => {},
});

export const useAatman = () => useContext(AatmanContext);

export const AatmanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);

    const updateTelemetry = (updates: Partial<TelemetryData>) => {
        setTelemetry(prev => ({ ...prev, ...updates }));
    };

    const setAIState = (state: AIState) => {
        setTelemetry(prev => ({ ...prev, aiState: state }));
    };

    const setPipelineStep = (id: PipelineStep['id'], status: PipelineStatus) => {
        setTelemetry(prev => ({
            ...prev,
            pipeline: prev.pipeline.map(step => step.id === id ? { ...step, status } : step)
        }));
    };

    const resetPipeline = () => {
        setTelemetry(prev => ({
            ...prev,
            pipeline: defaultPipeline.map(step => ({ ...step }))
        }));
    };

    const addLog = (scope: SystemLog['scope'], message: string) => {
        setTelemetry(prev => ({
            ...prev,
            logs: [
                ...prev.logs.slice(-79),
                { id: `${Date.now()}-${Math.random()}`, scope, message, createdAt: Date.now() }
            ]
        }));
    };

    const addToolExecution = (tool: any) => {
        setTelemetry(prev => ({
            ...prev,
            toolsExecution: [...prev.toolsExecution, tool]
        }));
    };

    const updateToolExecution = (name: string, updates: any) => {
        setTelemetry(prev => ({
            ...prev,
            toolsExecution: prev.toolsExecution.map(t => 
                t.name === name ? { ...t, ...updates } : t
            )
        }));
    };

    const resetTelemetry = () => {
        setTelemetry(prev => ({
            ...defaultTelemetry,
            logs: prev.logs,
            pipeline: defaultPipeline.map(step => ({ ...step }))
        }));
    };

    return (
        <AatmanContext.Provider value={{ telemetry, updateTelemetry, setAIState, setPipelineStep, resetPipeline, addLog, addToolExecution, updateToolExecution, resetTelemetry }}>
            {children}
        </AatmanContext.Provider>
    );
};
