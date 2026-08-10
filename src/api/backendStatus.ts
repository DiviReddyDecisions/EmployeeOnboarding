import { useSyncExternalStore } from "react";

/**
 * Tracks whether the configured Decisions environment is reachable.
 *
 * When it is not, the app keeps working against the local reference data set
 * and shows a persistent banner so nobody mistakes reference data for real
 * Decisions data. No business decision is ever taken from this flag.
 */

export type BackendStatus = "unknown" | "connected" | "unreachable" | "mock";

let status: BackendStatus = "unknown";
let lastError: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setBackendStatus(next: BackendStatus, error?: string | null) {
  if (status === next && (error ?? null) === lastError) return;
  status = next;
  lastError = error ?? null;
  emit();
}

export function getBackendStatus(): BackendStatus {
  return status;
}

export function getBackendError(): string | null {
  return lastError;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBackendStatus(): { status: BackendStatus; error: string | null } {
  const value = useSyncExternalStore(
    subscribe,
    () => `${status}|${lastError ?? ""}`,
    () => "unknown|",
  );
  const [statusPart, errorPart] = value.split("|");
  return {
    status: (statusPart ?? "unknown") as BackendStatus,
    error: errorPart ? errorPart : null,
  };
}
