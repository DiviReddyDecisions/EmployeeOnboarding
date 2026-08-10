/**
 * Decisions authentication.
 *
 * Ported from the Decisions Public Web Apps skeleton: when the app is hosted
 * inside Decisions (Custom Web Apps), the portal session is used to mint a JWT
 * via AccountService/GetJWT. The token is stored in a cookie and sent as a
 * bearer token on every API call. There is no second auth system in this app.
 */

const COOKIE_NAME = "employeeonboarding_auth";

// Cookies set from JS cannot carry the HttpOnly flag — that requires a server-side
// Set-Cookie header. Secure + SameSite=Strict is the best client-side protection.
function cookieFlags(): string {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `; path=/; SameSite=Strict${secure}`;
}

export function storeAuthToken(token: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}${cookieFlags()}`;
}

export function clearAuthToken(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieFlags()}`;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function redirectToLogin(): void {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const portalBase = env["VITE_DEC_PORTAL_BASE"] ?? "";
  if (env["VITE_DEC_PORTAL_FOR_PROXY"]) {
    window.location.href = `${env["VITE_DEC_PORTAL_FOR_PROXY"]}/Login?ReturnURL=${window.location.href}`;
  } else {
    window.location.href = `${portalBase.replace("/Primary", "")}/Login?ReturnURL=${import.meta.env.BASE_URL}index.html`;
  }
}

/**
 * Acquires a JWT from the Decisions portal session. Returns the token, or null
 * when the portal session is missing/unreachable.
 */
export async function acquireAuthToken(): Promise<string | null> {
  const existing = getAuthToken();
  if (existing) return existing;

  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const portalBase = (env["VITE_DEC_PORTAL_BASE"] ?? "").replace(/\/$/, "");
  try {
    const res = await fetch(`${portalBase}/REST/AccountService/GetJWT`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputType: "JSON" }),
      credentials: "include",
    });
    const data = (await res.json()) as { GetJWTResult?: string };
    if (data?.GetJWTResult) {
      storeAuthToken(data.GetJWTResult);
      return data.GetJWTResult;
    }
    return null;
  } catch (error) {
    console.error("Error fetching JWT:", error);
    return null;
  }
}
