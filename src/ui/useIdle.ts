import { useEffect, useState } from 'react';

/**
 * True once nobody has touched the screen (or pressed a key) for `ms`; a fresh touch starts the wait again.
 * Change `key` to restart the wait when the situation changes, e.g. a new modal. With `ms` null it never turns true.
 */
export function useIdle(ms: number | null, key: unknown = null): boolean {
  const [idle, setIdle] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` only restarts the timer
  useEffect(() => {
    setIdle(false);
    if (ms === null) return;
    let t = window.setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), ms);
    };
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('keydown', wake, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
    };
  }, [ms, key]);
  return idle;
}
