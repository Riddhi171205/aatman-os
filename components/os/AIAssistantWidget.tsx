import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAatman } from '../AatmanContext';
import { useKernel } from './kernel/KernelContext';
import { Mic, X, Activity, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function AIAssistantWidget() {
  const { telemetry, setAIState, updateTelemetry, resetTelemetry, setPipelineStep, addLog } = useAatman();
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [command, setCommand] = useState('');
  
  // Audio Pipeline State
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const systemAwakeRef = useRef<boolean>(true); // Default to awake for desktop widget

  const isProcessing = telemetry.aiState === 'thinking' || telemetry.aiState === 'executing';
  const isResponding = telemetry.aiState === 'responding';

  const kernel = useKernel();

  useEffect(() => {
    kernel.setAIActivity(isProcessing || isResponding || isListening);
  }, [isProcessing, isResponding, isListening]);

  useEffect(() => {
    setSessionId(`AATMAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    
    // Unlock Speech Synthesis
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

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // --- Voice Engine ---
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        const cleanedFinal = finalTranscript.trim();
        setCommand(cleanedFinal);
        handleSend(undefined, cleanedFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        stopAllListening();
        startRecordingFallback();
      } else {
        setIsListening(false);
        setAIState('idle');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setAIState('idle');
      if (permissionGranted && !isProcessingRef.current) {
        window.setTimeout(() => startSpeechRecognition(), 300);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setPermissionGranted(true);
      setAIState('listening');
      return true;
    } catch (err) {
      return false;
    }
  };

  const startRecordingFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleAudioCaptured(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setPermissionGranted(true);
      setAIState('listening');

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopAllListening();
      }, 5000);

    } catch (err) {
      toast.error("Microphone Access Denied");
    }
  };

  const stopAllListening = () => {
    setPermissionGranted(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setAIState('idle');
  };

  const toggleListening = () => {
    if (isListening) stopAllListening();
    else if (!startSpeechRecognition()) startRecordingFallback();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isListeningRef.current && !recognitionRef.current) startSpeechRecognition();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isProcessing && permissionGranted && !isListening && !recognitionRef.current && !mediaRecorderRef.current) {
      startSpeechRecognition();
    }
  }, [isProcessing, permissionGranted, isListening]);

  // Auto-execute typed commands after 1.5 seconds of no typing
  useEffect(() => {
    if (!command.trim() || isProcessing) return;

    const timer = setTimeout(() => {
      handleSend();
    }, 1500);

    return () => clearTimeout(timer);
  }, [command, isProcessing]);

  // --- Logic Engine ---
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

  const parseOpenIntent = (text: string) => {
    const cleaned = text.trim().replace(/.*?\b(tom|aeris|computer)\b[\s,.:;-]*/i, '');
    const match = cleaned.match(/^(?:please\s+)?open\s+(?:the\s+)?(.+?)\s*$/i)
      || cleaned.match(/^(?:please\s+)?launch\s+(?:the\s+)?(.+?)\s*$/i);
    if (!match) return null;
    let target = match[1].trim().replace(/\s+(?:app|application|website|site)$/i, '');
    if (!target) return null;
    return { action: 'open_app', target }; // Simplified for desktop intent
  };

  const parseSystemIntent = (text: string) => {
    if (/antigravity/i.test(text) || /zero gravity/i.test(text)) {
      const state = /disable|off|stop|deactivate/i.test(text) ? 'off' : 'on';
      return { action: 'system_mode', params: { mode: 'antigravity', state } };
    }
    return null;
  };

  const beginPipeline = (input: string) => {
    resetTelemetry();
    setAIState('thinking');
    updateTelemetry({ stage: 'Thinking' });
    addLog('System', `Command received: ${input}`);
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const input = (textOverride !== undefined ? textOverride : command).trim();
    if (!input || !sessionId || isProcessing) return;

    const hasWakeWord = /\b(tom|aeris|computer)\b/i.test(input);
    const isVoiceInput = textOverride !== undefined;

    // Wake word checks
    if (hasWakeWord && !systemAwakeRef.current) {
      systemAwakeRef.current = true;
      toast.success("Continuous Listening Mode: ACTIVE");
    }
    if (isVoiceInput && !systemAwakeRef.current && !hasWakeWord) return;

    setCommand('');
    beginPipeline(input);

    try {
      const systemIntent = parseSystemIntent(input);
      if (systemIntent) {
        setAIState('executing');
        if (systemIntent.params.state === 'on') {
          speakAssistantResponse(`Activating Antigravity Mode, Sir. Disabling system gravity.`);
          kernel.setAntigravityMode(true);
        } else {
          speakAssistantResponse(`Restoring standard gravity parameters, Sir.`);
          kernel.setAntigravityMode(false);
        }
        // Send execution to backend
        api.executeAction({ action: systemIntent.action, params: systemIntent.params }).catch(() => {});
        return;
      }

      const intent = parseOpenIntent(input);
      if (intent) {
        setAIState('executing');
        const openResult = await api.executeAction({ action: intent.action, params: { appName: intent.target } });
        speakAssistantResponse(`Executing that now.`);
        return;
      }

      const res = await api.sendMessage({ userId: 'guest', sessionId, message: input });
      speakAssistantResponse(res.message);

    } catch (err: any) {
      toast.error(err.message || 'Execution failed.');
      setAIState('idle');
    }
  };

  const handleAudioCaptured = async (blob: Blob) => {
    if (!sessionId || isProcessing) return;
    setAIState('thinking');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('userId', 'guest');
      formData.append('sessionId', sessionId);

      const res = await fetch('/api/voice/process', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Voice processing failed");
      const data = await res.json();
      speakAssistantResponse(data.response);
    } catch (err: any) {
      toast.error("Audio processing failed.");
      setAIState('idle');
    }
  };


  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-12 right-4 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full border border-primary/30 shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:bg-black/70 transition-colors"
      >
        <Activity className="w-5 h-5 text-primary animate-pulse" />
      </button>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-12 right-4 z-50 w-80 flex flex-col rounded-2xl border border-[#7B61FF]/30 shadow-[0_10px_50px_rgba(123,97,255,0.2)] backdrop-blur-2xl bg-[#050014]/80 overflow-hidden"
    >
      {/* Header */}
      <div className="h-10 px-4 bg-white/5 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold text-white/80 tracking-widest uppercase">AATMAN Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-white/50 hover:text-white transition-colors">
            {isMinimized ? <MessageSquare className="w-3.5 h-3.5" /> : <div className="w-3 h-0.5 bg-current" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex flex-col"
          >
            {/* Waveform Visualization */}
            <div 
              className="h-32 flex flex-col items-center justify-center p-4 border-b border-white/5 bg-gradient-to-b from-transparent to-[#7B61FF]/5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={toggleListening}
            >
              <div className="flex items-end justify-center space-x-1 h-16 w-full">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 rounded-t-sm ${
                      isListening ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                      isProcessing ? 'bg-secondary shadow-[0_0_8px_rgba(123,97,255,0.5)]' :
                      isResponding ? 'bg-primary shadow-[0_0_8px_rgba(0,245,212,0.5)]' :
                      'bg-white/20'
                    }`}
                    animate={{
                      height: (isListening || isProcessing || isResponding) 
                        ? ['20%', `${Math.random() * 80 + 20}%`, '20%'] 
                        : '10%'
                    }}
                    transition={{
                      duration: isProcessing ? 1 : (isListening || isResponding) ? Math.random() * 0.5 + 0.3 : 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.05
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase font-mono mt-4 text-white/50 tracking-widest">
                {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isResponding ? 'Responding...' : 'Standby'}
              </span>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4">
              <div className="relative">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={isProcessing}
                  placeholder={isProcessing ? "Processing..." : "Ask AATMAN..."}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-secondary/50 transition-colors pr-10 disabled:opacity-50"
                />
                <button type="submit" disabled={isProcessing || !command.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-secondary transition-colors disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/40 mb-2 px-1 font-medium">Suggestions</p>
                {['Open Chrome', 'What time is it?', 'Open VS Code'].map((sug, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => {
                        setCommand(sug);
                        setTimeout(() => handleSend(undefined, sug), 50);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
