import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Ear } from 'lucide-react';
import { AIState } from './AatmanContext';

const WAKE_SETTING_KEY = 'aatman_always_awake_enabled';
const CLAP_SETTING_KEY = 'aatman_clap_wake_enabled';

const getStoredBoolean = (key: string, fallback: boolean) => {
    if (typeof window === 'undefined') return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
};

export default function VoiceControls({ 
    onAudioCaptured, 
    onTranscriptCaptured,
    onVoiceStateChange,
    isProcessing,
    autoWakeWord = false
}: { 
    onAudioCaptured: (blob: Blob) => void, 
    onTranscriptCaptured: (text: string) => void,
    onVoiceStateChange?: (state: AIState) => void,
    isProcessing: boolean,
    autoWakeWord?: boolean
}) {
    const [isListening, setIsListening] = useState(false);
    const [alwaysListenMode, setAlwaysListenMode] = useState(() => getStoredBoolean(WAKE_SETTING_KEY, autoWakeWord));
    const [clapWakeEnabled, setClapWakeEnabled] = useState(() => getStoredBoolean(CLAP_SETTING_KEY, autoWakeWord));
    const [voiceStatus, setVoiceStatus] = useState('Voice Interface');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any>(null);
    const clapStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const clapFrameRef = useRef<number | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const wakeModeRef = useRef(false);
    const clapWakeRef = useRef(false);
    const isListeningRef = useRef(false);
    const clapCommandUntilRef = useRef(0);
    const lastClapAtRef = useRef(0);
    const isProcessingRef = useRef(false);
    const shouldRestartRef = useRef(false);

    useEffect(() => {
        wakeModeRef.current = alwaysListenMode;
        window.localStorage.setItem(WAKE_SETTING_KEY, String(alwaysListenMode));
    }, [alwaysListenMode]);

    useEffect(() => {
        clapWakeRef.current = clapWakeEnabled;
        window.localStorage.setItem(CLAP_SETTING_KEY, String(clapWakeEnabled));
    }, [clapWakeEnabled]);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        if (!autoWakeWord) return;

        if (getStoredBoolean(WAKE_SETTING_KEY, true)) {
            setAlwaysListenMode(true);
            wakeModeRef.current = true;
        }

        if (getStoredBoolean(CLAP_SETTING_KEY, true)) {
            setClapWakeEnabled(true);
            clapWakeRef.current = true;
        }
    }, [autoWakeWord]);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    const extractWakeCommand = (transcript: string) => {
        const match = transcript.match(/\btom\b[\s,.:;-]*(.*)$/i);
        return match?.[1]?.trim() || '';
    };

    const startSpeechRecognition = (wakeMode = alwaysListenMode) => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) return false;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = wakeMode;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const latestResult = event.results[event.results.length - 1];
            const transcript = latestResult?.[0]?.transcript?.trim() || '';

            if (!transcript) return;

            if (wakeModeRef.current) {
                if (Date.now() < clapCommandUntilRef.current) {
                    clapCommandUntilRef.current = 0;
                    setVoiceStatus('Clap command detected');
                    onTranscriptCaptured(transcript);
                    return;
                }

                const command = extractWakeCommand(transcript);

                if (command) {
                    setVoiceStatus('Wake word detected');
                    onTranscriptCaptured(command);
                } else if (/\btom\b/i.test(transcript)) {
                    setVoiceStatus('Listening for command...');
                } else {
                    setVoiceStatus('Waiting for "Tom"...');
                }

                return;
            }

            if (transcript) {
                onTranscriptCaptured(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            if (event.error !== 'no-speech') {
                alert(`Speech recognition failed: ${event.error}`);
            }
            setIsListening(false);
            onVoiceStateChange?.('idle');
            setVoiceStatus(wakeModeRef.current ? 'Wake word paused' : 'Voice Interface');
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            onVoiceStateChange?.('idle');

            if (shouldRestartRef.current && wakeModeRef.current && !isProcessingRef.current) {
                window.setTimeout(() => startSpeechRecognition(true), 300);
            } else {
                setVoiceStatus(wakeModeRef.current ? 'Always awake. Re-arming...' : 'Voice Interface');
            }
        };

        recognitionRef.current = recognition;
        shouldRestartRef.current = wakeMode;
        try {
            recognition.start();
            setIsListening(true);
            onVoiceStateChange?.('listening');
            setVoiceStatus(wakeMode ? 'Waiting for "Tom"...' : 'Recording Audio...');
            return true;
        } catch (err) {
            console.error("Speech recognition could not start:", err);
            setVoiceStatus('Enable microphone access');
            return false;
        }
    };

    useEffect(() => {
        if (alwaysListenMode && !isProcessing && !isListening && !recognitionRef.current) {
            startSpeechRecognition(true);
        }
    }, [alwaysListenMode, isProcessing, isListening]);

    useEffect(() => {
        const rearmAwakeMode = () => {
            if (
                wakeModeRef.current &&
                !isProcessingRef.current &&
                !isListeningRef.current &&
                !recognitionRef.current &&
                document.visibilityState === 'visible'
            ) {
                startSpeechRecognition(true);
            }
        };

        const interval = window.setInterval(rearmAwakeMode, 1500);
        document.addEventListener('visibilitychange', rearmAwakeMode);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', rearmAwakeMode);
        };
    }, []);

    const stopClapDetection = () => {
        if (clapFrameRef.current) {
            cancelAnimationFrame(clapFrameRef.current);
            clapFrameRef.current = null;
        }

        clapStreamRef.current?.getTracks().forEach((track) => track.stop());
        clapStreamRef.current = null;

        audioContextRef.current?.close().catch(() => {});
        audioContextRef.current = null;
    };

    const startClapDetection = async () => {
        if (!clapWakeEnabled || clapStreamRef.current || !navigator.mediaDevices?.getUserMedia) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextCtor();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            const data = new Uint8Array(analyser.fftSize);

            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.2;
            source.connect(analyser);

            clapStreamRef.current = stream;
            audioContextRef.current = audioContext;

            const detect = () => {
                analyser.getByteTimeDomainData(data);

                let peak = 0;
                let sum = 0;
                for (const value of data) {
                    const normalized = Math.abs(value - 128) / 128;
                    peak = Math.max(peak, normalized);
                    sum += normalized * normalized;
                }

                const rms = Math.sqrt(sum / data.length);
                const now = Date.now();

                if (clapWakeRef.current && peak > 0.82 && rms > 0.18 && now - lastClapAtRef.current > 900) {
                    lastClapAtRef.current = now;
                    clapCommandUntilRef.current = now + 7000;
                    setVoiceStatus('Clap detected. Speak now...');

                    if (!recognitionRef.current && !isProcessingRef.current) {
                        startSpeechRecognition(true);
                    }
                }

                clapFrameRef.current = requestAnimationFrame(detect);
            };

            detect();
        } catch (err) {
            console.error("Clap wake could not start:", err);
            setVoiceStatus('Enable microphone for clap wake');
        }
    };

    useEffect(() => {
        if (clapWakeEnabled) {
            startClapDetection();
        } else {
            stopClapDetection();
        }

        return stopClapDetection;
    }, [clapWakeEnabled]);

    const startRecording = async () => {
        try {
            if (startSpeechRecognition()) {
                return;
            }

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
            onVoiceStateChange?.('listening');
            setVoiceStatus('Recording Audio...');

            // If not in always-listen mode, auto-stop after a few seconds or when user clicks
            if (!alwaysListenMode) {
                setTimeout(() => {
                    if (mediaRecorderRef.current?.state === 'recording') {
                        stopRecording();
                    }
                }, 5000); // Record 5 seconds of audio for demo
            }
        } catch (err) {
            console.error("Microphone access denied or error:", err);
            // We need to import toast if it's not imported, or just use alert
            alert("Microphone access denied or an error occurred.");
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            shouldRestartRef.current = false;
            recognitionRef.current.stop();
            recognitionRef.current = null;
            setIsListening(false);
            onVoiceStateChange?.('idle');
            setVoiceStatus(wakeModeRef.current ? 'Wake word paused' : 'Voice Interface');
            return;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            onVoiceStateChange?.('idle');
            setVoiceStatus('Voice Interface');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setAlwaysListenMode(false);
            wakeModeRef.current = false;
            stopRecording();
        } else {
            startRecording();
        }
    };

    const toggleWakeWord = () => {
        const nextWakeMode = !alwaysListenMode;
        setAlwaysListenMode(nextWakeMode);
        setClapWakeEnabled(nextWakeMode);
        wakeModeRef.current = nextWakeMode;
        clapWakeRef.current = nextWakeMode;

        if (!nextWakeMode) {
            stopRecording();
            return;
        }

        if (!isListening && !isProcessing) {
            const started = startSpeechRecognition(true);
            if (!started) {
                setAlwaysListenMode(false);
                wakeModeRef.current = false;
                alert('Wake word mode needs browser speech recognition. Try Chrome or Edge over localhost.');
            }
        }
    };

    const toggleClapWake = () => {
        const nextClapMode = !clapWakeEnabled;
        setClapWakeEnabled(nextClapMode);
        clapWakeRef.current = nextClapMode;

        if (nextClapMode && !alwaysListenMode) {
            setAlwaysListenMode(true);
            wakeModeRef.current = true;
        }
    };

    return (
        <div className="flex items-center gap-4 bg-card/5 border border-border p-3 rounded-none">
            <button 
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative flex items-center justify-center w-12 h-12 border ${
                    isProcessing 
                        ? 'border-primary/20 bg-primary/5 text-primary/30 cursor-not-allowed' 
                        : isListening 
                            ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                            : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/20'
                } transition-colors`}
            >
                {isProcessing ? (
                    <Volume2 className="w-5 h-5 animate-pulse" />
                ) : isListening ? (
                    <>
                        <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-50" />
                        <MicOff className="w-5 h-5" />
                    </>
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>

            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                    {isProcessing ? 'Processing Audio...' : voiceStatus}
                </span>
                <div className="mt-2 flex h-5 items-end gap-1">
                    {[35, 62, 44, 78, 52, 88, 48, 70].map((height, index) => (
                        <span
                            key={index}
                            className={`w-1 rounded-full bg-cyan-200/70 ${isListening || isProcessing ? 'animate-pulse' : 'opacity-35'}`}
                            style={{
                                height: `${isListening || isProcessing ? height : 24}%`,
                                animationDelay: `${index * 90}ms`
                            }}
                        />
                    ))}
                </div>
                
                <button 
                    onClick={toggleWakeWord}
                    className="flex items-center gap-1 mt-1 text-[9px] font-mono uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
                >
                    <Ear className={`w-3 h-3 ${alwaysListenMode ? 'text-primary' : ''}`} />
                    Wake Word ("Tom"): {alwaysListenMode ? 'Active' : 'Disabled'}
                </button>
                <button 
                    onClick={toggleClapWake}
                    className="flex items-center gap-1 mt-1 text-[9px] font-mono uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
                >
                    <Mic className={`w-3 h-3 ${clapWakeEnabled ? 'text-primary' : ''}`} />
                    Clap Wake: {clapWakeEnabled ? 'Active' : 'Disabled'}
                </button>
            </div>
        </div>
    );
}
