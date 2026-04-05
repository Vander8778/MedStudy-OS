import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { shouldRunPolling } from "../utils/polling";

export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number,
  options: {
    enabled: boolean;
    isFocused?: boolean;
    runImmediately?: boolean;
  }
) {
  const [appState, setAppState] = useState(AppState.currentState);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const shouldPoll = shouldRunPolling({
      enabled: options.enabled,
      isFocused: options.isFocused ?? true,
      appState
    });

    if (!shouldPoll || intervalMs <= 0) {
      return;
    }

    if (options.runImmediately !== false) {
      void callbackRef.current();
    }

    const timer = setInterval(() => {
      void callbackRef.current();
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [appState, intervalMs, options.enabled, options.isFocused, options.runImmediately]);
}
