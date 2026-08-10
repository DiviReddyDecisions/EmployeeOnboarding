# API Inventory — EmployeeOnboarding

Base URL: `VITE_DEC_PORTAL_BASE` + `VITE_DEC_PROJECT_API_BASE_URL`.
Auth: bearer JWT on every request (`Authorization: Bearer <token>`), obtained by `src/Auth.tsx`.
Every write endpoint is a Decisions flow; the front end never mutates case data directly.
All action endpoints return the full updated `OnboardingCase` under `Done` so the client can replace cached state.

Common errors: `401` (no/expired token), `403` (role not permitted), `404` (case not found),
`409` (guard violated, e.g. approving a non-current step), `422` (validation issues returned in `ValidationIssues`), `500` (flow failure).

---

## 1. AccountService/GetCurrentAccount

| | |
| --- | --- |
| Namespace | Decisions core |
| Method | `GET` |
| Path | `/REST/AccountService/GetCurrentAccount` |
| Purpose | Identify the signed-in account. |
| Consuming screen | App shell, `AuthGate` |
| Request | — |
| Response | `{ "GetCurrentAccountResult": { "EmailAddress": "...", "DisplayName": "...", "AccountId": "...", "Groups": ["HR Specialists"] } }` |
| Auth | Bearer JWT |
| Audit | None (read) |

## 2. EmployeeOnboarding/GetCurrentUserRoles

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/getcurrentuserroles` |
| Purpose | Map Decisions groups/permissions to app roles. Roles are never derived client-side. |
| Consuming screen | App shell (drives nav and action visibility) |
| Request | `{}` |
| Response | `{ "Done": ["HRSpecialist", "Approver"] }` |
| Errors | `401` |

## 3. OnboardingCase/GetAll

| | |
| --- | --- |
| Method | `GET` |
| Path | `/REST/OnboardingCaseCaseDataService/GetAll` |
| Purpose | Case list for dashboard, list, approvals, tasks and exceptions views. |
| Consuming screen | `/`, `/cases`, `/approvals`, `/tasks`, `/exceptions` |
| Response | `OnboardingCase[]` |
| Notes | Server-side row filtering by role is expected; the client filters only for presentation. |

## 4. OnboardingCase/GetById

| | |
| --- | --- |
| Method | `GET` |
| Path | `/REST/OnboardingCaseCaseDataService/GetById?id=<caseId>` |
| Purpose | Full case detail with all child collections. |
| Consuming screen | `/cases/$caseId` |
| Response | `OnboardingCase` |
| Errors | `404` |

## 5. EmployeeOnboarding/SaveDraft

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/savedraft` |
| Purpose | Persist an incomplete case without validation gating. |
| Consuming screen | `/cases/new` |
| Request | `{ "Request": OnboardingCaseInput }` |
| Response | `{ "Done": OnboardingCase }` — `Stage: "Draft"`, `Status: "Draft"` |
| Audit | `DraftSaved` |

Example request:

```json
{
  "Request": {
    "Employee": { "FirstName": "Ada", "LastName": "Lovelace", "PersonalEmail": "ada@example.com", "Country": "UK" },
    "Employment": { "PositionId": "pos-3", "PositionTitle": "Engineer", "DepartmentId": "dep-1",
      "DepartmentName": "Engineering", "ManagerId": "mgr-2", "ManagerName": "Grace H.",
      "LocationId": "loc-1", "LocationName": "London", "EmploymentType": "FullTime", "StartDate": "2026-09-01" },
    "Compensation": { "BaseSalary": 95000, "Currency": "GBP", "PayFrequency": "Monthly", "BonusEligible": false }
  }
}
```

## 6. EmployeeOnboarding/Create

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/create` |
| Purpose | Create **and** submit in one step: runs `ValidateCase`, then `DetermineRequirements`. |
| Consuming screen | `/cases/new` |
| Request | `{ "Request": OnboardingCaseInput }` |
| Response | `{ "Done": OnboardingCase }` |
| Errors | `422` with populated `ValidationIssues` |
| Audit | `CaseCreated`, `CaseSubmitted`, `ValidationCompleted` |

## 7. EmployeeOnboarding/Submit

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/submit` |
| Purpose | Move an existing draft into `Validation`. |
| Consuming screen | `/cases/$caseId` |
| Request | `{ "CaseId": "..." }` |
| Response | `{ "Done": OnboardingCase }` |
| Audit | `CaseSubmitted` |

## 8. EmployeeOnboarding/Approve

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/approve` |
| Purpose | Approve the current approval step; advances to the next sequence or the next stage. |
| Consuming screen | `/approvals`, `/cases/$caseId` |
| Request | `{ "CaseId": "...", "ApprovalId": "...", "Comments": "" }` |
| Response | `{ "Done": OnboardingCase }` |
| Errors | `403` (not the assigned approver), `409` (not the current step) |
| Audit | `ApprovalApproved` |
| Notification | `ApprovalRequested` to the next approver |

## 9. EmployeeOnboarding/RequestChanges

Same shape as Approve. Path `/requestchanges`. `Comments` is **required**.
Sets `Status: "ChangesRequired"`, returns the case to `Draft`, raises a `ChangesRequired` exception.
Audit `ApprovalChangesRequested`; notification `ChangesRequested`.

## 10. EmployeeOnboarding/Reject

Same shape as Approve. Path `/reject`. `Comments` is **required**.
Sets `Status: "Rejected"` and a non-resolvable exception. Audit `ApprovalRejected`; notification `CaseRejected`.

## 11. EmployeeOnboarding/UpdateDocument

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/updatedocument` |
| Purpose | Move a document requirement through its status lifecycle; records the uploaded file name. |
| Consuming screen | `/cases/$caseId` (Documents tab) |
| Request | `{ "CaseId": "...", "DocumentId": "...", "Status": "Complete", "FileName": "offer.pdf" }` |
| Response | `{ "Done": OnboardingCase }` |
| Audit | `DocumentStatusChanged` |

## 12. EmployeeOnboarding/UpdateSignature

Path `/updatesignature`. Request `{ CaseId, SignatureId, Status }`.
Statuses mirror the e-signature provider callbacks. Audit `SignatureStatusChanged`.

## 13. EmployeeOnboarding/UpdateTask

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/updatetask` |
| Purpose | Start, block or complete an operational task. |
| Consuming screen | `/tasks`, `/cases/$caseId` |
| Request | `{ "CaseId": "...", "TaskId": "...", "Status": "Blocked", "Reason": "Laptop stock" }` |
| Response | `{ "Done": OnboardingCase }` |
| Errors | `422` when `Status = Blocked` without `Reason` |
| Audit | `TaskStatusChanged` |

## 14. EmployeeOnboarding/Complete

Path `/complete`. Request `{ CaseId }`. Guarded to the `HRManager` role and `FinalReview` stage.
Sets `Stage/Status = Completed` and `CompletedOn`. Audit `CaseCompleted`; notification `CaseCompleted`.

## 15. EmployeeOnboarding/ChangeStatus

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/changestatus` |
| Purpose | Hold, resume or cancel a case. |
| Consuming screen | `/cases/$caseId`, `/exceptions` |
| Request | `{ "CaseId": "...", "Status": "OnHold", "Reason": "Start date moved" }` |
| Response | `{ "Done": OnboardingCase }` |
| Audit | `StatusChanged` |

## 16. EmployeeOnboarding/AddComment

Path `/addcomment`. Request `{ CaseId, Text }`. Audit `CommentAdded`.

## 17. EmployeeOnboarding/GetReferenceData

| | |
| --- | --- |
| Method | `POST` |
| Path | `/restapi/employeeonboarding/onboarding/getreferencedata` |
| Purpose | Departments, positions, locations, managers, document types, task templates, approval matrix. |
| Consuming screen | `/cases/new`, `/reference` |
| Request | `{}` |
| Response | `{ "Done": ReferenceData }` |
| Caching | Client caches for 10 minutes. |

## 18. EmployeeOnboarding/GetDashboardKpis

Path `/getdashboardkpis`. Request `{}`. Response `{ Done: KpiSummary }`.
Consumed by `/` and `/reports`. Counts are user-scoped (`AwaitingMyApproval`, `MyOpenTasks`).

## 19. EmployeeOnboarding/GetStageCounts

Path `/getstagecounts`. Request `{}`. Response `{ Done: StageCount[] }`. Consumed by `/` and `/reports`.

## 20. EmployeeOnboarding/GetReports

Path `/getreports`. Request `{}`. Response `{ Done: ReportSet }` with `StageAging`,
`ApprovalTurnaround`, `TaskCompletionByTeam`, `CycleTimeByDepartment`, `SlaBreaches`.
Consumed by `/reports`. Auditor role has read-only access.

---

## Fallback behaviour

`src/api/apiclient.ts` wraps every call in `withFallback`. When the configured Decisions
environment is unreachable (or `VITE_DEC_MODE=mock`), the client serves the local reference
data set and surfaces a banner via `backendStatus.ts`. The fallback is presentation-only —
it never makes a business decision the backend should own.
