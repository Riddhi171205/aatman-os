import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const POLL_MS = 15000;

/**
 * Polls the Python AATMAN BRAIN health via /api/brain/status.
 * null = not checked yet.
 */
export function useBrainStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      api.getBrainStatus()
        .then((res) => { if (!cancelled) setOnline(!!res.online); })
        .catch(() => { if (!cancelled) setOnline(false); });
    };
    check();
    const id = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return online;
}
