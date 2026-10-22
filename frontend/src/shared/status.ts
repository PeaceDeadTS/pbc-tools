import { useCallback, useEffect, useRef, useState } from 'react';

export function useStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const flash = useCallback((message: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setStatus(message);
    timer.current = window.setTimeout(() => setStatus(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  return { status, flash };
}
