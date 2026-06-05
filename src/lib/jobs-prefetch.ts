import { useSyncExternalStore } from "react";

export type PrefetchStatus = "idle" | "loading" | "success" | "error" | "timeout";

let status: PrefetchStatus = "idle";
const listeners = new Set<() => void>();

export const jobsPrefetch = {
  get: () => status,
  set(next: PrefetchStatus) {
    if (status === next) return;
    status = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useJobsPrefetchStatus(): PrefetchStatus {
  return useSyncExternalStore(
    jobsPrefetch.subscribe,
    jobsPrefetch.get,
    () => "idle" as PrefetchStatus,
  );
}
