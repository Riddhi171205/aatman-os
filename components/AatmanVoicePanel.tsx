import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlienGlassCard } from './ui/AlienGlassCard';
import { useAatman, AIState } from './AatmanContext';
import { Activity } from 'lucide-react';

export function AatmanVoicePanel({
  onAudioCaptured,
  onTranscriptCaptured,
  onVoiceStateChange,
  isProcessing,
}: {
  onAudioCaptured: (blob: Blob) => void,
  onTranscriptCaptured: (text: string) => void,
  onVoiceStateChange?: (state: AIState) => void,
  isProcessing: boolean,
}) {
  const { telemetry } = useAatman();
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Click to Initialize Link');
  const [permissionGranted, setPermissionGranted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false; // Force fallback
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true; // Show real-time feedback

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (interimTranscript) {
        setVoiceStatus(interimTranscript); // Show them we are actively hearing them!
      }

      if (finalTranscript) {
        const cleanedFinal = finalTranscript.trim();
        setVoiceStatus('Command Detected: ' + cleanedFinal);
        onTranscriptCaptured(cleanedFinal);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      // If the native speech recognition fails for any reason (permissions, brave shield, network)
      // We immediately attempt the more reliable MediaRecorder fallback
      if (event.error !== 'no-speech') {
        console.log("Attempting fallback to MediaRecorder...");
        stopAllListening();
        startRecordingFallback();
      } else {
        setIsListening(false);
        onVoiceStateChange?.('idle');
        setVoiceStatus('No speech detected. Click again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      onVoiceStateChange?.('idle');

      if (permissionGranted && !isProcessingRef.current) {
        window.setTimeout(() => startSpeechRecognition(), 300);
      } else {
        setVoiceStatus('Link Dormant. Click to Arm.');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setPermissionGranted(true);
      onVoiceStateChange?.('listening');
      setVoiceStatus('Neural Link Active');
      return true;
    } catch (err) {
      console.error("Speech recognition could not start:", err);
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioCaptured(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setPermissionGranted(true);
      onVoiceStateChange?.('listening');
      setVoiceStatus('Recording Audio (Fallback Mode)...');

      // In fallback mode, we auto-stop recording after 5 seconds of capturing since it doesn't auto-detect silence
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopAllListening();
        }
      }, 5000);

    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setVoiceStatus("Mic Access Denied");
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
    onVoiceStateChange?.('idle');
    setVoiceStatus('Link Severed. Click to Reconnect');
  };

  const toggleListening = () => {
    if (isListening) {
      stopAllListening();
    } else {
      const started = startSpeechRecognition();
      if (!started) {
        startRecordingFallback();
      }
    }
  };

  // Attempt to auto-start listening on mount for zero-friction experience
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isListeningRef.current && !recognitionRef.current) {
        startSpeechRecognition();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-rearm if processing finishes and we had permissions (only for SpeechRecognition, not MediaRecorder fallback)
  useEffect(() => {
    if (!isProcessing && permissionGranted && !isListening && !recognitionRef.current && !mediaRecorderRef.current) {
      startSpeechRecognition();
    }
  }, [isProcessing, permissionGranted, isListening]);

  return (
    <AlienGlassCard className="flex flex-col justify-between p-6 cursor-pointer hover:border-primary/50 transition-colors" onClick={toggleListening}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-bold tracking-widest text-white uppercase">Audio Input Stream</h3>
        </div>
        {isListening && (
          <span className="text-xs text-primary animate-pulse tracking-widest">LIVE</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="flex items-end justify-center space-x-1 h-16 w-full">
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-1.5 rounded-t-sm ${isProcessing ? 'bg-secondary/80 shadow-[0_0_8px_rgba(123,97,255,0.5)]' : 'bg-primary/80 shadow-[0_0_8px_rgba(0,245,212,0.5)]'}`}
              animate={{
                height: isProcessing ? ['20%', '100%', '20%'] : isListening ? ['20%', `${Math.random() * 80 + 20}%`, '20%'] : '10%'
              }}
              transition={{
                duration: isProcessing ? 1 : isListening ? Math.random() * 0.5 + 0.3 : 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#00F5D4]/20 pt-4 mt-2">
        <span className={`text-[10px] font-mono tracking-widest ${isListening ? 'text-primary' : isProcessing ? 'text-secondary animate-pulse' : 'text-muted-foreground'}`}>
          {'>'} {isProcessing ? 'PROCESSING AUDIO...' : voiceStatus.toUpperCase()}
        </span>
        <span className="text-xs font-mono text-secondary tracking-widest">
          SIG: {isListening ? '87%' : '0%'}
        </span>
      </div>
    </AlienGlassCard>
  );
}
