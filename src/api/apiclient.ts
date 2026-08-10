/**
 * Decisions API client for the EmployeeOnboarding namespace.
 *
 * Conventions follow the Decisions Custom Web App skeleton:
 *  - base URL from VITE_DEC_PORTAL_BASE + VITE_DEC_PROJECT_API_BASE_URL
 *  - bearer JWT from Auth.ts on every request
 *  - flows/rules are POSTed to /restapi/<namespace>/<folder>/<endpoint>
 *  - case data is read through a Case Data Service (GetAll / GetById / SaveOrCreate)
 *
 * The endpoints below are the contract the Decisions backend must implement;
 * they are documented in docs/API-INVENTORY.md and docs/decisions-contract.json.
 * Until they exist, calls fail and the app falls back to the local reference
 * data set with a visible banner (see backendStatus.ts).
 */

import { getAuthToken } from "../Auth";
import { apiBaseUrl, decisionsConfig } from "./config";
import { setBackendStatus } from "./backendStatus";
import { mockBackend } from "./mock/mockBackend";
import type { CurrentUser, DecisionsAccount } from "./types/Account";
import type { KpiSummary, ReportSet, StageCount } from "./types/Reports";
import type { OnboardingCase, OnboardingCaseInput } from "./types/OnboardingCase";
import type { ReferenceData } from "./types/ReferenceData";

const FLOW_ROOT = `/restapi/${decisionsConfig.namespace}/onboarding`;
const CASE_SERVICE = "/REST/OnboardingCaseCaseDataService";

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function get(path: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: getHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function post(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Calls Decisions and, if the environment/endpoint is not available, falls back
 * to the local reference data set. The fallback is presentation-only: it never
 * makes a business decision the backend should own.
 */
async function withFallback<T>(
  operation: string,
  call: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (decisionsConfig.mode === "mock") {
    setBackendStatus("mock");
    return fallback();
  }
  try {
    const result = await call();
    setBackendStatus("connected");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Decisions] ${operation} failed (${message}); using local reference data.`);
    setBackendStatus("unreachable", `${operation}: ${message}`);
    return fallback();
  }
}

/* -------------------------------------------------------------------------- */
/* Account                                                                     */
/* -------------------------------------------------------------------------- */

/** GET /REST/AccountService/GetCurrentAccount */
export async function GetCurrentUserAccount(): Promise<CurrentUser> {
  return withFallback(
    "AccountService/GetCurrentAccount",
    async () => {
      const data = (await get("/REST/AccountService/GetCurrentAccount")) as {
        GetCurrentAccountResult: DecisionsAccount;
      };
      const account = data.GetCurrentAccountResult;
      return {
        Account: account,
        DisplayName: account.DisplayName ?? account.EmailAddress,
        Email: account.EmailAddress,
        // Roles are resolved by Decisions from the account's groups/permissions.
        Roles: (await resolveRoles()) ?? [],
      } satisfies CurrentUser;
    },
    () => mockBackend.getCurrentUser(),
  );
}

/** POST /restapi/<ns>/onboarding/getcurrentuserroles */
async function resolveRoles(): Promise<CurrentUser["Roles"] | null> {
  try {
    const data = (await post(`${FLOW_ROOT}/getcurrentuserroles`, {})) as {
      Done?: CurrentUser["Roles"];
    };
    return data.Done ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Onboarding cases                                                            */
/* -------------------------------------------------------------------------- */

/** GET /REST/OnboardingCaseCaseDataService/GetAll */
export async function OnboardingCaseGetAll(): Promise<OnboardingCase[]> {
  return withFallback(
    "OnboardingCase/GetAll",
    async () => {
      const data = (await get(`${CASE_SERVICE}/GetAll`)) as { GetAllResult: OnboardingCase[] };
      return data.GetAllResult;
    },
    () => mockBackend.getAll(),
  );
}

/** GET /REST/OnboardingCaseCaseDataService/GetById?id= */
export async function OnboardingCaseGetById(id: string): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/GetById",
    async () => {
      const data = (await get(`${CASE_SERVICE}/GetById?id=${encodeURIComponent(id)}`)) as {
        GetByIdResult: OnboardingCase;
      };
      return data.GetByIdResult;
    },
    () => mockBackend.getById(id),
  );
}

/** POST /restapi/<ns>/onboarding/create */
export async function OnboardingCaseCreate(
  input: OnboardingCaseInput,
  submit: boolean,
): Promise<OnboardingCase> {
  return withFallback(
    submit ? "OnboardingCase/Create+Submit" : "OnboardingCase/SaveDraft",
    async () => {
      const data = (await post(`${FLOW_ROOT}/${submit ? "create" : "savedraft"}`, {
        Request: input,
      })) as { Done: OnboardingCase };
      return data.Done;
    },
    () => mockBackend.create(input, submit),
  );
}

/** POST /restapi/<ns>/onboarding/submit */
export async function OnboardingCaseSubmit(id: string): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/Submit",
    async () => ((await post(`${FLOW_ROOT}/submit`, { CaseId: id })) as { Done: OnboardingCase }).Done,
    () => mockBackend.submit(id),
  );
}

/** POST /restapi/<ns>/onboarding/approve | requestchanges | reject */
export async function OnboardingCaseDecideApproval(
  id: string,
  approvalId: string,
  decision: "Approve" | "RequestChanges" | "Reject",
  comments: string,
): Promise<OnboardingCase> {
  const endpoint =
    decision === "Approve" ? "approve" : decision === "Reject" ? "reject" : "requestchanges";
  return withFallback(
    `OnboardingCase/${decision}`,
    async () =>
      (
        (await post(`${FLOW_ROOT}/${endpoint}`, {
          CaseId: id,
          ApprovalId: approvalId,
          Comments: comments,
        })) as { Done: OnboardingCase }
      ).Done,
    () => mockBackend.decideApproval(id, approvalId, decision, comments),
  );
}

/** POST /restapi/<ns>/onboarding/updatedocument */
export async function OnboardingCaseUpdateDocument(
  id: string,
  documentId: string,
  status: string,
  fileName?: string,
): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/UpdateDocument",
    async () =>
      (
        (await post(`${FLOW_ROOT}/updatedocument`, {
          CaseId: id,
          DocumentId: documentId,
          Status: status,
          FileName: fileName ?? null,
        })) as { Done: OnboardingCase }
      ).Done,
    () => mockBackend.updateDocument(id, documentId, status, fileName),
  );
}

/** POST /restapi/<ns>/onboarding/updatesignature */
export async function OnboardingCaseUpdateSignature(
  id: string,
  signatureId: string,
  status: string,
): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/UpdateSignature",
    async () =>
      (
        (await post(`${FLOW_ROOT}/updatesignature`, {
          CaseId: id,
          SignatureId: signatureId,
          Status: status,
        })) as { Done: OnboardingCase }
      ).Done,
    () => mockBackend.updateSignature(id, signatureId, status),
  );
}

/** POST /restapi/<ns>/onboarding/updatetask */
export async function OnboardingCaseUpdateTask(
  id: string,
  taskId: string,
  status: string,
  reason?: string,
): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/UpdateTask",
    async () =>
      (
        (await post(`${FLOW_ROOT}/updatetask`, {
          CaseId: id,
          TaskId: taskId,
          Status: status,
          Reason: reason ?? null,
        })) as { Done: OnboardingCase }
      ).Done,
    () => mockBackend.updateTask(id, taskId, status, reason),
  );
}

/** POST /restapi/<ns>/onboarding/complete */
export async function OnboardingCaseComplete(id: string): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/Complete",
    async () =>
      ((await post(`${FLOW_ROOT}/complete`, { CaseId: id })) as { Done: OnboardingCase }).Done,
    () => mockBackend.complete(id),
  );
}

/** POST /restapi/<ns>/onboarding/changestatus (hold, resume, cancel) */
export async function OnboardingCaseChangeStatus(
  id: string,
  status: string,
  reason: string,
): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/ChangeStatus",
    async () =>
      (
        (await post(`${FLOW_ROOT}/changestatus`, {
          CaseId: id,
          Status: status,
          Reason: reason,
        })) as { Done: OnboardingCase }
      ).Done,
    () => mockBackend.changeStatus(id, status, reason),
  );
}

/** POST /restapi/<ns>/onboarding/addcomment */
export async function OnboardingCaseAddComment(id: string, text: string): Promise<OnboardingCase> {
  return withFallback(
    "OnboardingCase/AddComment",
    async () =>
      (
        (await post(`${FLOW_ROOT}/addcomment`, { CaseId: id, Text: text })) as {
          Done: OnboardingCase;
        }
      ).Done,
    () => mockBackend.addComment(id, text),
  );
}

/* -------------------------------------------------------------------------- */
/* Reference data, dashboard and reporting                                     */
/* -------------------------------------------------------------------------- */

/** POST /restapi/<ns>/onboarding/getreferencedata */
export async function GetReferenceData(): Promise<ReferenceData> {
  return withFallback(
    "Reference/GetAll",
    async () =>
      ((await post(`${FLOW_ROOT}/getreferencedata`, {})) as { Done: ReferenceData }).Done,
    () => mockBackend.getReferenceData(),
  );
}

/** POST /restapi/<ns>/onboarding/getdashboardkpis */
export async function GetDashboardKpis(): Promise<KpiSummary> {
  return withFallback(
    "Dashboard/GetKpis",
    async () => ((await post(`${FLOW_ROOT}/getdashboardkpis`, {})) as { Done: KpiSummary }).Done,
    () => mockBackend.getKpis(),
  );
}

/** POST /restapi/<ns>/onboarding/getstagecounts */
export async function GetStageCounts(): Promise<StageCount[]> {
  return withFallback(
    "Dashboard/GetStageCounts",
    async () => ((await post(`${FLOW_ROOT}/getstagecounts`, {})) as { Done: StageCount[] }).Done,
    () => mockBackend.getStageCounts(),
  );
}

/** POST /restapi/<ns>/onboarding/getreports */
export async function GetReports(): Promise<ReportSet> {
  return withFallback(
    "Reporting/GetReports",
    async () => ((await post(`${FLOW_ROOT}/getreports`, {})) as { Done: ReportSet }).Done,
    () => mockBackend.getReports(),
  );
}
