import { useEffect, useRef } from 'react';

export function useClapDetector(onClap: () => void, isEnabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastClapTimeRef = useRef<number>(0);
  
  // A rolling window of past volume levels to detect sudden spikes
  const historyRef = useRef<number[]>(Array(10).fill(0));

  useEffect(() => {
    if (!isEnabled) return;

    let isCleanup = false;

    const startDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCleanup) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detect = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS (Root Mean Square) volume
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            // dataArray values are 0-255, center is 128
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);

          // Update rolling history
          historyRef.current.shift();
          historyRef.current.push(rms);

          // Calculate average of previous levels to find baseline noise
          const baseline = historyRef.current.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
          
          // Current volume
          const currentVol = historyRef.current[9];

          // Thresholds for detecting a clap (sudden, sharp spike)
          // 1. Current volume must be above an absolute minimum threshold
          // 2. Current volume must be significantly higher than the recent baseline
          const minAbsoluteVolume = 0.15; // Adjust this sensitivity if needed
          const spikeMultiplier = 4.0; // Volume must be 4x the baseline

          const now = Date.now();
          const timeSinceLastClap = now - lastClapTimeRef.current;

          if (
            currentVol > minAbsoluteVolume &&
            currentVol > baseline * spikeMultiplier &&
            timeSinceLastClap > 2000 // 2 second cooldown
          ) {
            console.log("CLAP DETECTED! Volume:", currentVol, "Baseline:", baseline);
            lastClapTimeRef.current = now;
            onClap();
          }

          requestRef.current = requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error("Clap Detector failed to initialize microphone:", err);
      }
    };

    startDetection();

    return () => {
      isCleanup = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isEnabled, onClap]);
}
