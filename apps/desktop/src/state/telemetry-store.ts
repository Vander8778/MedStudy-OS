import { create } from "zustand";
import type { BufferHealth, TelemetryStatus } from "../types";

type TelemetryStore = {
  status: TelemetryStatus;
  bufferHealth: BufferHealth;
  setStatus: (status: TelemetryStatus) => void;
  setBufferHealth: (health: BufferHealth) => void;
};

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  status: {
    capturing: false,
    queuedEvents: 0,
    retainedUploadedEvents: 0,
    discardedEvents: 0,
    consecutiveFailureCount: 0,
    nextRetryInMs: 0,
    queueWarning: false
  },
  bufferHealth: {
    maxEvents: 10_000,
    pendingEvents: 0,
    retainedUploadedEvents: 0,
    totalEvents: 0,
    prunedUploadedEvents: 0,
    prunedPendingEvents: 0,
    queueWarning: false
  },
  setStatus: (status) => set({ status }),
  setBufferHealth: (bufferHealth) => set({ bufferHealth })
}));
