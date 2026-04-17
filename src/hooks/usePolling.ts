/**
 * usePolling — calls `fn` immediately, then on every `intervalMs` tick
 * and whenever the browser tab regains focus.
 */
import { useEffect, useRef } from "react";

export function usePolling(fn: () => void, intervalMs = 30_000) {
  const fnRef = useRef(fn);
  fnRef.current = fn; // keep latest reference without re-subscribing

  useEffect(() => {
    fnRef.current();

    const interval = setInterval(() => fnRef.current(), intervalMs);
    const onFocus  = () => fnRef.current();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);
}
