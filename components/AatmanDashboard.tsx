import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AatmanProvider, useAatman } from './AatmanContext';
import { AatmanSidebar } from './AatmanSidebar';
import { AatmanTopNav, ChatEngine } from './AatmanTopNav';
import { useBrainStatus } from './useBrainStatus';
import { AatmanBottomBar } from './AatmanBottomBar';
import { AatmanRightPanel } from './AatmanRightPanel';
import { AatmanAICore } from './AatmanAICore';
import { AatmanVoicePanel } from './AatmanVoicePanel';
import { AatmanAnalyticsGrid } from './AatmanAnalyticsGrid';
import { AatmanMemorySection } from './AatmanMemorySection';
import { AatmanCommandInterface } from './AatmanCommandInterface';
import VoiceControls from './VoiceControls';
import { useClapDetector } from './useClapDetector';
import { DesktopEnvironment } from './os/DesktopEnvironment';

interface AatmanDashboardProps {
  user?: any;
  onLogout?: () => void;
}

function DashboardLayout({ user, onLogout }: AatmanDashboardProps) {
  const [command, setCommand] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [engine, setEngine] = useState<ChatEngine>(() => {
    try {
      return localStorage.getItem('aatman_engine') === 'brain' ? 'brain' : 'llm';
    } catch {
      return 'llm';
    }
  });
  const brainOnline = useBrainStatus();

  const changeEngine = (next: ChatEngine) => {
    setEngine(next);
    try { localStorage.setItem('aatman_engine', next); } catch {}
    toast.info(next === 'brain' ? 'Routing through AATMAN Brain' : 'Routing through LLM core');
  };

  // Track if the system has been permanently woken up (Continuous Listening Mode)
  const systemAwakeRef = React.useRef<boolean>(false);

  const { telemetry, updateTelemetry, resetTelemetry, setAIState, setPipelineStep, addLog } = useAatman();

  // Implement Clap Detector for zero-friction wake up
  useClapDetector(() => {
    if (!systemAwakeRef.current) {
      systemAwakeRef.current = true;
      toast.success("Clap Detected. Continuous Listening Mode: ACTIVE");
      speakAssistantResponse("System online. Awaiting commands, sir.");
    }
  }, true);

  useEffect(() => {
    // Generate a session ID if one doesn't exist
    setSessionId(`AATMAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  }, []);

  // Unlock Speech Synthesis on first interaction to allow background voice responses
  React.useEffect(() => {
    const unlockSpeech = () => {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }
      window.removeEventListener('click', unlockSpeech);
      window.removeEventListener('keydown', unlockSpeech);
    };
    window.addEventListener('click', unlockSpeech);
    window.addEventListener('keydown', unlockSpeech);
    return () => {
      window.removeEventListener('click', unlockSpeech);
      window.removeEventListener('keydown', unlockSpeech);
    };
  }, []);

  // Bring back text-to-speech
  const speakAssistantResponse = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const cleanText = text.replace(/```[\s\S]*?```/g, 'code block omitted').replace(/[`*_#>[\]()]/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => /daniel|arthur|oliver/i.test(v.name)) || voices.find((v) => /english|en-/i.test(v.name));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.05;
    utterance.onstart = () => {
      setAIState('responding');
      updateTelemetry({ stage: 'Generating Response' });
    };
    utterance.onend = () => {
      setAIState('idle');
      updateTelemetry({ stage: 'Idle' });
    };
    window.speechSynthesis.speak(utterance);
  };

  const getInstantReply = (text: string) => {
    const cleaned = text.trim().replace(/.*?\b(tom|aeris|computer)\b[\s,.:;-]*/i, '').toLowerCase();
    if (/^(hi|hello|hey|status|system status)$/.test(cleaned)) return 'All core systems are responsive and nominal, sir.';
    if (/^(what time is it|time)$/.test(cleaned)) return `It is ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}, sir.`;
    if (/^(stop talking|quiet|silence)$/.test(cleaned)) {
      window.speechSynthesis?.cancel();
      return 'Understood. Audio suppressed.';
    }
    return null;
  };

  const parseOpenIntent = (text: string): { action: 'open_url' | 'open_app', target: string } | null => {
    const cleaned = text.trim().replace(/.*?\b(tom|aeris|computer)\b[\s,.:;-]*/i, '');
    const match = cleaned.match(/^(?:please\s+)?open\s+(?:the\s+)?(.+?)\s*$/i)
      || cleaned.match(/^(?:please\s+)?launch\s+(?:the\s+)?(.+?)\s*$/i)
      || cleaned.match(/^(?:please\s+)?start\s+(?:the\s+)?(.+?)\s*$/i);

    if (!match) return null;

    let target = match[1].trim().replace(/\s+(?:app|application|website|site)$/i, '');
    if (!target) return null;

    const appTargets = [
      'calculator', 'calendar', 'chrome', 'code', 'firefox', 'mail',
      'messages', 'music', 'notes', 'safari', 'spotify', 'terminal',
      'vscode', 'whatsapp', 'system preferences', 'settings', 'finder'
    ];
    const compactTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    const looksLikeUrl = /^https?:\/\//i.test(target) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(target);
    const websiteNames = ['amazon', 'chatgpt', 'facebook', 'github', 'gmail', 'google', 'instagram', 'linkedin', 'netflix', 'reddit', 'twitter', 'x', 'youtube'];

    if (looksLikeUrl || websiteNames.includes(compactTarget)) {
      return { action: 'open_url', target };
    }

    if (appTargets.includes(compactTarget) || appTargets.some(app => compactTarget.includes(app.replace(/\s/g, '')))) {
      return { action: 'open_app', target };
    }

    // Default to URL if it doesn't match an app
    return { action: 'open_url', target };
  };

  const executeOpenIntent = async (text: string) => {
    const intent = parseOpenIntent(text);
    if (!intent) return null;

    const result = await api.executeAction({
      action: intent.action,
      params: intent.action === 'open_app' ? { appName: intent.target } : { url: intent.target }
    });
    return result.status === 'success' ? (result.result as string) : null;
  };

  const isSystemUpdateIntent = (text: string) => {
    const cleaned = text.trim().replace(/.*?\b(tom|aeris|computer)\b[\s,.:;-]*/i, '').toLowerCase();
    return /^(?:please\s+)?(?:update|upgrade)\s+(?:the\s+)?system$/.test(cleaned)
      || /^(?:please\s+)?check\s+(?:for\s+)?(?:system\s+)?updates$/.test(cleaned)
      || /^(?:please\s+)?open\s+(?:software\s+updates?|system\s+updates?)$/.test(cleaned);
  };

  const executeSystemUpdateIntent = async (text: string) => {
    if (!isSystemUpdateIntent(text)) return null;

    const result = await api.executeAction({
      action: 'update_system',
      params: {}
    });

    return result.status === 'success' ? (result.result as string) : null;
  };

  const beginPipeline = (input: string) => {
    resetTelemetry();
    setAIState('thinking');
    updateTelemetry({ stage: 'Thinking' });
    setPipelineStep('input', 'active');
    addLog('System', `Command received: ${input}`);
    window.setTimeout(() => setPipelineStep('input', 'complete'), 200);
    window.setTimeout(() => {
      setPipelineStep('memory', 'active');
      addLog('Memory', 'Scanning databanks');
    }, 300);
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const input = (textOverride !== undefined ? textOverride : command).trim();
    if (!input || !sessionId || isGenerating) return;

    // Check for sleep command to turn off continuous listening
    if (/^(go to sleep|sleep|standby|stop listening)$/i.test(input.replace(/.*?\b(tom|aeris|computer)\b[\s,.:;-]*/i, '').trim())) {
      systemAwakeRef.current = false;
      setCommand('');
      speakAssistantResponse("Entering standby mode, sir. Wake me if you need me.");
      toast.info("Continuous Listening: OFF");
      return;
    }

    const hasWakeWord = /\b(tom|aeris|computer)\b/i.test(input);

    // If the user uses a wake word, they instantly activate Continuous Mode
    if (hasWakeWord && !systemAwakeRef.current) {
      systemAwakeRef.current = true;
      toast.success("Continuous Listening Mode: ACTIVE");
    }

    const isVoiceInput = textOverride !== undefined;

    // Require either continuous mode or an explicit wake word for VOICE input only
    // Typed commands should always be executed
    if (isVoiceInput && !systemAwakeRef.current && !hasWakeWord) {
      return; // Ignore background chatter
    }

    setCommand('');
    setIsGenerating(true);
    beginPipeline(input);

    try {
      const instantReply = getInstantReply(input);
      if (instantReply) {
        setPipelineStep('memory', 'complete');
        setPipelineStep('planner', 'complete');
        setPipelineStep('execution', 'complete');
        setPipelineStep('response', 'complete');
        speakAssistantResponse(instantReply);
        return;
      }

      setPipelineStep('planner', 'active');
      const updateResult = await executeSystemUpdateIntent(input);
      if (updateResult) {
        setAIState('executing');
        setPipelineStep('planner', 'complete');
        setPipelineStep('memory', 'complete');
        setPipelineStep('execution', 'complete');
        setPipelineStep('response', 'complete');
        addLog('Execution', updateResult);
        speakAssistantResponse('Opening system update settings now.');
        return;
      }

      const openResult = await executeOpenIntent(input);
      if (openResult) {
        setAIState('executing');
        setPipelineStep('planner', 'complete');
        setPipelineStep('memory', 'complete');
        setPipelineStep('execution', 'complete');
        setPipelineStep('response', 'complete');
        addLog('Execution', openResult);
        speakAssistantResponse(`Certainly. Executing that now.`);
        return;
      }

      setPipelineStep('planner', 'complete');
      setPipelineStep('response', 'active');
      const useBrain = engine === 'brain' && brainOnline !== false;
      addLog('Agent', useBrain ? 'Querying AATMAN Brain' : 'Querying LLM Core');

      const res = await api.sendMessage({
        userId: user?.id || 'guest',
        sessionId: sessionId,
        message: input,
        engine: useBrain ? 'brain' : 'llm'
      });

      const brain = res.observability?.brain;
      if (brain) {
        addLog('Brain', `Intent: ${brain.intent.label} (${Math.round(brain.intent.confidence * 100)}%)`);
        addLog('Brain', `Plan: ${brain.plan.length} step(s), confidence ${Math.round(brain.explanation.confidence * 100)}%`);
      } else if (res.observability?.brainFallback) {
        addLog('Brain', 'Brain unreachable, fell back to LLM core');
      }

      if (res.observability) {
        updateTelemetry({
          stage: 'Generating Response',
          latencyMs: res.observability.latencyMs,
          activeModel: res.observability.activeModel
        });
      }

      setPipelineStep('memory', 'complete');
      setPipelineStep('response', 'complete');
      addLog('Response', 'Action successful');
      speakAssistantResponse(res.message);

    } catch (err: any) {
      toast.error(err.message || 'Execution failed.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => updateTelemetry({ stage: 'Idle' }), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info("Uploading datastream...");
      const res = await api.uploadFile(file);
      toast.success("Datastream parsed: " + res.filename);
    } catch (e) {
      toast.error("Upload failed.");
    }
  };

  const handleTranscriptCaptured = async (text: string) => {
    setCommand(text);
    // Pass text directly to avoid stale React closures
    handleSend(undefined, text);
  };

  const handleAudioCaptured = async (blob: Blob) => {
    if (!sessionId || isGenerating) return;
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('userId', user?.id || 'guest');
      formData.append('sessionId', sessionId);

      const token = localStorage.getItem('aatman_token');
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData
      });

      if (!res.ok) throw new Error("Voice processing failed");
      const data = await res.json();
      speakAssistantResponse(data.response);
    } catch (err: any) {
      toast.error("Audio processing failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">


      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 technical-grid opacity-30" />
      </div>

      <AatmanSidebar />

      <div className="flex flex-col flex-1 relative z-10 h-full overflow-hidden">
        <AatmanTopNav
          user={user}
          onLogout={onLogout}
          engine={engine}
          onEngineChange={changeEngine}
          brainOnline={brainOnline}
        />

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Center Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col"
          >
            {/* Top row: AI Core and Voice Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AatmanAICore />
              </div>
              <div className="lg:col-span-1">
                <AatmanVoicePanel
                  isProcessing={isGenerating}
                  onAudioCaptured={handleAudioCaptured}
                  onTranscriptCaptured={handleTranscriptCaptured}
                  onVoiceStateChange={(state) => {
                    setAIState(state);
                    updateTelemetry({ stage: state === 'listening' ? 'Listening' : 'Idle' });
                    if (state === 'listening') addLog('Voice', 'Audio stream opened');
                  }}
                />
              </div>
            </div>

            {/* Middle row: Analytics and Memory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              <div className="lg:col-span-2">
                <AatmanAnalyticsGrid />
              </div>
              <div className="lg:col-span-1">
                <AatmanMemorySection />
              </div>
            </div>

            {/* Bottom row: Command Interface */}
            <div className="mt-auto">
              <AatmanCommandInterface
                command={command}
                setCommand={setCommand}
                onExecute={handleSend}
                onFileUpload={handleFileUpload}
                isProcessing={isGenerating}
              />
            </div>
          </motion.div>

          {/* Right Pipeline Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="h-full hidden md:block"
          >
            <AatmanRightPanel />
          </motion.div>
        </main>

        <AatmanBottomBar />
      </div>
    </div>
  );
}

export default function AatmanDashboard(props: AatmanDashboardProps) {
  return (
    <AatmanProvider>
      <DesktopEnvironment />
    </AatmanProvider>
  );
}
