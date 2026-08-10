/**
 * Decisions environment configuration.
 *
 * Values come from the Vite environment (.env.development / .env.production),
 * following the VITE_DEC_* convention used by the Decisions Custom Web App
 * skeleton. No secret values are hard-coded in source.
 */

const env = import.meta.env as unknown as Record<string, string | undefined>;

export type DecisionsMode = "real" | "mock";

export const decisionsConfig = {
  portalBase: env["VITE_DEC_PORTAL_BASE"] ?? "",
  projectApiBase: env["VITE_DEC_PROJECT_API_BASE_URL"] ?? "",
  namespace: env["VITE_DEC_NAMESPACE"] ?? "employeeonboarding",
  appName: env["VITE_DEC_APP_NAME"] ?? "Employee Onboarding",
  /** "real" targets the configured Decisions environment. "mock" uses local reference data only. */
  mode: (env["VITE_DEC_MODE"] === "mock" ? "mock" : "real") as DecisionsMode,
};

export const apiBaseUrl = `${decisionsConfig.portalBase}${decisionsConfig.projectApiBase}`;
