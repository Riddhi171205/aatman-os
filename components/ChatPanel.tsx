import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, Paperclip, Loader2, Bot, User, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import VoiceControls from './VoiceControls';
import { useAatman } from './AatmanContext';

export default function ChatPanel({ currentConvoId, user }: { currentConvoId: string | null, user: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputTitle, setInputTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { updateTelemetry, resetTelemetry, setAIState, setPipelineStep, addLog } = useAatman();
  
  useEffect(() => {
    if (currentConvoId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [currentConvoId]);

  useEffect(() => {
      // Auto-scroll to bottom on new messages if we are already near the bottom
      if (bottomRef.current && !showScrollButton) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, isGenerating]);

  useEffect(() => {
      const handleScroll = () => {
          if (!viewportRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
          // Show button if user has scrolled up more than 100px from the bottom
          const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
          setShowScrollButton(isScrolledUp);
      };

      const viewport = viewportRef.current;
      if (viewport) {
          viewport.addEventListener('scroll', handleScroll);
          return () => viewport.removeEventListener('scroll', handleScroll);
      }
  }, [viewportRef.current]);

  const scrollToBottom = () => {
      if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const speakAssistantResponse = (text: string) => {
      if (!text || !('speechSynthesis' in window)) return;

      const cleanText = text
          .replace(/```[\s\S]*?```/g, 'code block omitted from voice response')
          .replace(/[`*_#>[\]()]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      if (!cleanText) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((voice) =>
          /daniel|arthur|oliver|google uk english male|microsoft guy|microsoft ryan/i.test(voice.name)
      ) || voices.find((voice) => /english|en-/i.test(`${voice.name} ${voice.lang}`));

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.08;
      utterance.pitch = 0.84;
      utterance.volume = 1;
      utterance.onstart = () => {
          setAIState('responding');
          updateTelemetry({ stage: 'Generating Response' });
          addLog('Response', 'Speaking response');
      };
      utterance.onend = () => {
          setAIState('idle');
          updateTelemetry({ stage: 'Idle' });
      };

      window.speechSynthesis.speak(utterance);
  };

  const parseOpenIntent = (text: string): { action: 'open_url' | 'open_app', target: string } | null => {
      const cleaned = text.trim().replace(/^tom[\s,.:;-]*/i, '');
      const match = cleaned.match(/^(?:please\s+)?open\s+(?:the\s+)?(.+?)\s*$/i)
          || cleaned.match(/^(?:please\s+)?launch\s+(?:the\s+)?(.+?)\s*$/i)
          || cleaned.match(/^(?:please\s+)?start\s+(?:the\s+)?(.+?)\s*$/i);

      if (!match) return null;

      let target = match[1].trim().replace(/\s+(?:app|application|website|site)$/i, '');
      if (!target) return null;

      const appTargets = [
          'calculator',
          'calendar',
          'chrome',
          'code',
          'firefox',
          'mail',
          'messages',
          'music',
          'notes',
          'safari',
          'spotify',
          'terminal',
          'vscode',
          'whatsapp'
      ];
      const compactTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      const looksLikeUrl = /^https?:\/\//i.test(target) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(target);
      const websiteNames = ['amazon', 'chatgpt', 'facebook', 'github', 'gmail', 'google', 'instagram', 'linkedin', 'netflix', 'reddit', 'twitter', 'x', 'youtube'];

      if (looksLikeUrl || websiteNames.includes(compactTarget)) {
          return { action: 'open_url', target };
      }

      if (appTargets.includes(compactTarget)) {
          return { action: 'open_app', target };
      }

      return { action: 'open_url', target };
  };

  const executeOpenIntent = async (text: string) => {
      const intent = parseOpenIntent(text);
      if (!intent) return null;

      const result = await api.executeAction({
          action: intent.action,
          params: intent.action === 'open_app' ? { appName: intent.target } : { url: intent.target }
      });

      if (result.status !== 'success') {
          throw new Error(result.result || 'Open command failed.');
      }

      return result.result as string;
  };

  const isSystemUpdateIntent = (text: string) => {
      const cleaned = text.trim().replace(/^tom[\s,.:;-]*/i, '').toLowerCase();
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

      if (result.status !== 'success') {
          throw new Error(result.result || 'System update command failed.');
      }

      return result.result as string;
  };

  const beginPipeline = (input: string) => {
      resetTelemetry();
      setAIState('thinking');
      updateTelemetry({ stage: 'Thinking' });
      setPipelineStep('input', 'active');
      addLog('System', `Received command: ${input}`);
      window.setTimeout(() => setPipelineStep('input', 'complete'), 160);
      window.setTimeout(() => {
          setPipelineStep('memory', 'active');
          addLog('Memory', 'Checking recent context');
      }, 260);
  };

  const completeFastPipeline = (scope: 'Response' | 'Execution', message: string) => {
      setPipelineStep('memory', 'complete');
      setPipelineStep('planner', 'complete');
      setPipelineStep('execution', scope === 'Execution' ? 'complete' : 'pending');
      setPipelineStep('response', 'complete');
      addLog(scope, message);
  };

  const getInstantReply = (text: string) => {
      const cleaned = text.trim().replace(/^tom[\s,.:;-]*/i, '').toLowerCase();

      if (/^(hi|hello|hey|you there)$/.test(cleaned)) {
          return 'Online and ready, sir.';
      }

      if (/^(status|system status|are you ready|ready)$/.test(cleaned)) {
          return 'All core systems are responsive, sir.';
      }

      if (/^(what time is it|time|current time)$/.test(cleaned)) {
          return `It is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, sir.`;
      }

      if (/^(stop talking|quiet|silence)$/.test(cleaned)) {
          window.speechSynthesis?.cancel();
          return 'Understood.';
      }

      return null;
  };

  const loadMessages = async () => {
    if (!currentConvoId) return;
    try {
      const res = await api.getMessages(currentConvoId);
      const msgs = res.messages || [];
      setMessages(msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputTitle.trim() || !currentConvoId || isGenerating) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: inputTitle };
    setMessages(prev => [...prev, userMessage]);
    setInputTitle('');
    setIsGenerating(true);
    beginPipeline(userMessage.content);

    try {
      const instantReply = getInstantReply(userMessage.content);

      if (instantReply) {
          const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: instantReply, created_at: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
          completeFastPipeline('Response', 'Answered with instant local response');
          speakAssistantResponse(instantReply);
          return;
      }

      setPipelineStep('planner', 'active');
      addLog('Agent', 'Classifying command intent');
      const updateResult = await executeSystemUpdateIntent(userMessage.content);

      if (updateResult) {
          const response = 'Opening system update settings now.';
          const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: response, created_at: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
          setAIState('executing');
          setPipelineStep('planner', 'complete');
          setPipelineStep('execution', 'complete');
          setPipelineStep('memory', 'complete');
          setPipelineStep('response', 'complete');
          addLog('Execution', updateResult);
          speakAssistantResponse(response);
          return;
      }

      const openResult = await executeOpenIntent(userMessage.content);

      if (openResult) {
          const response = `Certainly, sir. ${openResult}.`;
          const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: response, created_at: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
          setAIState('executing');
          setPipelineStep('planner', 'complete');
          setPipelineStep('execution', 'complete');
          setPipelineStep('memory', 'complete');
          setPipelineStep('response', 'complete');
          addLog('Execution', openResult);
          speakAssistantResponse(response);
          return;
      }

      setPipelineStep('planner', 'complete');
      setPipelineStep('execution', 'pending');
      setPipelineStep('response', 'active');
      addLog('Agent', 'Generating assistant response');
      const res = await api.sendMessage({
          userId: user.id,
          sessionId: currentConvoId,
          message: userMessage.content
      });
      const aiMsg = { id: res.messageId, role: 'assistant', content: res.message, created_at: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      
      if (res.observability) {
          updateTelemetry({
              stage: 'Generating Response',
              promptContext: res.observability.promptContext,
              latencyMs: res.observability.latencyMs,
              activeModel: res.observability.activeModel
          });
          setPipelineStep('memory', 'complete');
          setPipelineStep('response', 'complete');
          addLog('Memory', res.observability.promptContext?.retrievedMemory?.length ? 'Retrieved memory context' : 'No long-term memory used');
          addLog('Response', `Model response completed in ${res.observability.latencyMs}ms`);
      }
      
      setTimeout(() => updateTelemetry({ stage: 'Idle' }), 1000);

    } catch (err: any) {
        toast.error(err.message || 'Transmission failed.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          toast.info("Uploading datastream...");
          const res = await api.uploadFile(file);
          toast.success("Datastream parsed: " + res.filename);
      } catch(e) {
          toast.error("Upload failed.");
      }
  };

  const handleAudioCaptured = async (blob: Blob) => {
      if (!currentConvoId || isGenerating) return;
      setIsGenerating(true);
      
      try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('userId', user.id);
          formData.append('sessionId', currentConvoId);

          const token = localStorage.getItem('aatman_token');
          const res = await fetch('/api/voice/process', {
              method: 'POST',
              headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
              body: formData
          });

          if (!res.ok) throw new Error("Voice processing failed");
          const data = await res.json();
          
          // Append transcribed text as user message
          const userMessage = { id: Date.now().toString(), role: 'user', content: data.text || "(Inaudible)", created_at: Date.now() };
          
          // Append AI response
          const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: data.response, created_at: Date.now() };
      setMessages(prev => [...prev, userMessage, aiMsg]);

          speakAssistantResponse(data.response);
          
          completeFastPipeline('Response', 'Processed fallback audio transcription');

      } catch (err: any) {
          toast.error(err.message || 'Voice transmission failed.');
      } finally {
          setIsGenerating(false);
      }
  };

  const handleTranscriptCaptured = async (text: string) => {
      if (!currentConvoId || isGenerating || !text.trim()) return;

      const spokenText = text.trim();
      const userMessage = { id: Date.now().toString(), role: 'user', content: spokenText, created_at: Date.now() };
      setMessages(prev => [...prev, userMessage]);
      setIsGenerating(true);
      beginPipeline(spokenText);
      updateTelemetry({ stage: 'Transcribing' });

      try {
          const instantReply = getInstantReply(spokenText);

          if (instantReply) {
              const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: instantReply, created_at: Date.now() };
              setMessages(prev => [...prev, aiMsg]);
              completeFastPipeline('Response', 'Answered voice command instantly');
              speakAssistantResponse(instantReply);
              return;
          }

          setPipelineStep('planner', 'active');
          addLog('Agent', 'Classifying voice command');
          const openResult = await executeOpenIntent(spokenText);

          if (openResult) {
              const response = `Certainly, sir. ${openResult}.`;
              const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: response, created_at: Date.now() };
              setMessages(prev => [...prev, aiMsg]);
              setAIState('executing');
              setPipelineStep('planner', 'complete');
              setPipelineStep('memory', 'complete');
              setPipelineStep('execution', 'complete');
              setPipelineStep('response', 'complete');
              addLog('Execution', openResult);
              speakAssistantResponse(response);
              return;
          }

          setPipelineStep('planner', 'complete');
          setPipelineStep('response', 'active');
          addLog('Agent', 'Generating voice response');
          const token = localStorage.getItem('aatman_token');
          const res = await fetch('/api/voice/respond', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                  userId: user.id,
                  sessionId: currentConvoId,
                  text: spokenText
              })
          });

          if (!res.ok) {
              const error = await res.json().catch(() => null);
              throw new Error(error?.details || error?.error || "Voice processing failed");
          }

          const data = await res.json();
          const aiMsg = { id: data.messageId || Date.now().toString() + 'ai', role: 'assistant', content: data.response, created_at: Date.now() };
          setMessages(prev => [...prev, aiMsg]);

          if (data.observability) {
              updateTelemetry({
                  stage: 'Generating Response',
                  promptContext: data.observability.promptContext,
                  latencyMs: data.observability.latencyMs,
                  activeModel: data.observability.activeModel
              });
              setPipelineStep('memory', 'complete');
              setPipelineStep('response', 'complete');
              addLog('Memory', data.observability.promptContext?.retrievedMemory?.length ? 'Retrieved memory context' : 'No long-term memory used');
              addLog('Response', `Voice response completed in ${data.observability.latencyMs}ms`);
          }

          if (data.audio && !('speechSynthesis' in window)) {
              const audio = new Audio(data.audio);
              audio.play().catch((err) => console.warn("Audio playback failed:", err));
          }

          speakAssistantResponse(data.response);

          setTimeout(() => updateTelemetry({ stage: 'Idle' }), 1000);
      } catch (err: any) {
          toast.error(err.message || 'Voice transmission failed.');
      } finally {
          setIsGenerating(false);
      }
  };

  if (!currentConvoId) {
    return <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground font-mono text-sm uppercase tracking-widest">Awaiting active session initialization.</div>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      {/* CHAT HEADER */}
      <header className="h-14 border-b border-border flex items-center px-6 justify-between bg-card/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-primary/60">SESSION: {currentConvoId?.split('-')[0] || 'NEW'}</span>
          <div className="h-4 w-px bg-primary/30"></div>
          <span className="text-[10px] text-primary/60 uppercase tracking-widest">Cognitive_Orchestrator_Mode</span>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-primary/30 text-[10px] hover:bg-primary/10 text-primary transition-colors">EXPORT_LOGS</button>
          <button className="px-3 py-1 border border-primary/30 text-[10px] bg-primary text-black font-bold hover:bg-opacity-80 transition-colors">PURGE_CACHE</button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" viewportRef={viewportRef}>
        <div className="space-y-8 max-w-4xl mx-auto pb-6">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className="flex gap-4">
               <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold shrink-0 ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30 text-primary' : 'bg-primary text-black'}`}>
                  {msg.role === 'user' ? 'U' : 'A'}
               </div>
               <div className="flex-1 space-y-2">
                   <div className={`text-[10px] uppercase tracking-widest ${msg.role === 'user' ? 'text-primary/70' : 'text-primary font-bold'}`}>
                       {msg.role === 'user' ? 'USER' : 'AATMAN OS'} // {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                   </div>
                   {msg.role === 'user' ? (
                     <p className="text-sm text-primary/90 max-w-2xl leading-relaxed italic">
                       "{msg.content}"
                     </p>
                   ) : (
                     <div className="p-4 border border-primary/40 bg-primary/5 rounded-sm space-y-4 text-sm text-primary leading-relaxed whitespace-pre-wrap">
                       {msg.content}
                     </div>
                   )}
               </div>
            </div>
          ))}
          {isGenerating && (
              <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-black flex items-center justify-center text-[10px] font-bold">A</div>
                  <div className="flex-1 space-y-2">
                      <div className="text-[10px] text-primary font-bold uppercase tracking-widest">AATMAN OS // ...</div>
                      <div className="flex items-center text-xs font-mono uppercase tracking-widest text-primary/70 h-8 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Query...
                      </div>
                  </div>
              </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 w-8 h-8 bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary flex items-center justify-center rounded-full transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] z-50 backdrop-blur"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      <footer className="p-6 border-t border-border bg-card/50 backdrop-blur">
        {voiceMode && (
           <div className="mb-4">
               <VoiceControls 
                   isProcessing={isGenerating} 
                   onAudioCaptured={handleAudioCaptured} 
                   onTranscriptCaptured={handleTranscriptCaptured}
                   onVoiceStateChange={(state) => {
                       setAIState(state);
                       updateTelemetry({ stage: state === 'listening' ? 'Listening' : 'Idle' });
                       if (state === 'listening') addLog('Voice', 'Listening for wake word or command');
                   }}
                   autoWakeWord
               />
           </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
            <div className="absolute left-4 w-2 h-2 bg-primary animate-pulse rounded-full"></div>
            <input 
                type="text" 
                placeholder="EXECUTE COMMAND..." 
                className="w-full rounded-lg bg-black/45 border border-cyan-300/20 p-4 pl-10 pr-36 text-sm focus:outline-none focus:border-cyan-200/50 text-cyan-50 placeholder-cyan-100/30 shadow-[inset_0_0_24px_rgba(0,240,255,0.04)]"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                disabled={isGenerating}
            />
            <div className="absolute right-4 flex gap-4 text-primary/70">
              <label className="cursor-pointer hover:text-primary transition-colors text-[10px] flex items-center tracking-widest font-bold">
                  [FILE]
                  <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button 
                  type="button"
                  onClick={() => setVoiceMode(!voiceMode)}
                  className={`hover:text-primary transition-all text-[10px] font-bold tracking-widest ${voiceMode ? 'text-primary' : ''}`}
              >
                  [MIC]
              </button>

              <button 
                  type="submit" 
                  disabled={!inputTitle.trim() || isGenerating}
                  className="hover:text-primary transition-colors text-[10px] font-bold tracking-widest"
              >
                  [EXEC]
              </button>
            </div>
        </form>
        <div className="max-w-4xl mx-auto mt-3 flex flex-wrap items-center gap-2">
            {['status', 'open YouTube', 'what time is it', 'open Calculator'].map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInputTitle(suggestion)}
                    className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100/55 hover:text-cyan-50 hover:bg-cyan-300/10 transition-colors"
                >
                    {suggestion}
                </button>
            ))}
            <span className="h-4 w-px bg-cyan-300/15" />
            <span className="h-4 w-2 animate-pulse bg-cyan-200/70" />
        </div>
        <div className="text-center mt-2 text-[10px] text-primary/50 uppercase tracking-widest font-mono">
            {voiceMode ? '* Synthesis output active' : 'Keyboard Protocol Active'}
        </div>
      </footer>
    </div>
  );
}
