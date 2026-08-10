import { useEffect, useState, type ReactNode } from "react";

import { acquireAuthToken } from "@/Auth";
import { decisionsConfig } from "@/api/config";

/**
 * Decisions authentication gate.
 *
 * Runs only in the browser: the portal session and the JWT cookie do not exist
 * during SSR. When hosted inside Decisions the token is acquired silently. If
 * no token can be obtained the app still renders (read-only reference data) and
 * the backend banner explains the state — matching the skeleton's behaviour
 * without inventing a second authentication system.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(decisionsConfig.mode === "mock");

  useEffect(() => {
    if (decisionsConfig.mode === "mock") return;
    let cancelled = false;
    void acquireAuthToken().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <div
            className="mx-auto size-6 animate-spin rounded-full border-2 border-border border-t-primary"
            aria-hidden
          />
          <p className="mt-3 text-sm text-muted-foreground">Signing in to Decisions…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
