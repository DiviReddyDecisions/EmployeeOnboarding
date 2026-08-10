# Employee Onboarding — Decisions Custom Web App

Build a complete, enterprise-quality Employee Onboarding front end driven by the Employee Onboarding Business Process document, integrating with Decisions as the authoritative backend, plus the full documentation deliverable set required by the master prompt.

The reference ZIP is used only to learn Decisions integration conventions (JWT via `AccountService/GetJWT`, bearer token in a cookie, `apiclient.ts` conventions, Case Data Services, `VITE_DEC_*` env vars). None of its business functionality (Submission, InsuredCustomer, loss-run) is carried over.

## What gets built

### Roles and personas
HR Specialist, HR Manager (final review), Approver (manager/department/finance), Task Assignee (IT, Payroll, Facilities), Signer, Administrator/read-only auditor. Role comes from the Decisions account/permissions — never hard-coded or stored client-side.

### Screens
1. **Dashboard** — my open cases, my approvals, my tasks, overdue/escalated, stage funnel, KPI tiles.
2. **Onboarding cases list** — search, filter (stage, status, department, start date, owner), sort, pagination, saved views, bulk-safe actions.
3. **New onboarding request wizard** — Employee details, Employment (position, department, manager, location, start date), Compensation (conditional), Attachments, Review. Save-as-draft and submit.
4. **Case detail** — header with stage/status/SLA, and tabs:
   - Overview (employee, employment, compensation, validation results)
   - Requirements plan (determined approvals/documents/signatures/checks/tasks)
   - Approvals (approve / request changes / reject with comments)
   - Documents (required list, generate, upload, review, preview/download)
   - Signatures (send, pending, signed, declined, retained signed copy)
   - Operational tasks (assignee, due date, complete, block, reassign, overdue)
   - Final HR review checklist and Complete action
   - Timeline / audit trail, comments, notifications sent
5. **My Approvals** and **My Tasks** work queues.
6. **Exceptions console** — Changes Required, Rejected, Cancelled, On Hold, Overdue, Failure with retry/manual resolution.
7. **Reports** — cycle time, stage aging, approval turnaround, task completion, SLA breaches, completion rate; export.
8. **Reference data / admin (read-only from backend)** — departments, positions, locations, document types, task templates, approval matrix.
9. **Auth gate**, 404, error and unauthorized states.

Every screen has loading, skeleton, empty, error and success states, confirmation dialogs for destructive/irreversible actions, responsive layout, keyboard/ARIA accessibility, and client-side (presentation-only) validation.

### Business-logic boundary
React never decides workflow state, required steps, approver identity, SLA/escalation, authorization or audit. It renders what Decisions returns and calls actions. Any place where the backend endpoint does not exist yet is surfaced as an explicit, documented gap rather than simulated in React.

## Technical approach

- **Stack:** this project runs TanStack Start (TanStack Router, SSR-capable). Routing stays TanStack — `react-router-dom` and `BrowserRouter` are not used. Everything else mirrors the reference layout:
  - `src/Auth.tsx` — GetJWT acquisition, cookie storage, `getAuthToken`, `redirectToLogin` (ported verbatim in behaviour)
  - `src/api/apiclient.ts` — same `get`/`post` + bearer-header conventions, extended with the Employee Onboarding namespace
  - `src/api/types/*.ts` — generated-style TypeScript types (OnboardingCase, ApprovalTask, RequiredDocument, SignatureRequest, OperationalTask, AuditEvent, reference data)
  - `src/api/stores/*.ts` — Case Data Service style stores
  - `src/api/userInfoStore.ts` — current account
- **Auth:** client-only gate that runs after hydration (no SSR JWT call), wrapping the app routes; unauthenticated users are redirected to the Decisions login. No second auth system, no Supabase/Firebase/Node backend.
- **Env:** `.env.development` / `.env.production` style `VITE_DEC_PORTAL_BASE`, `VITE_DEC_PROJECT_API_BASE_URL`, `VITE_DEC_MODE=real` pointing at the supplied Decisions environment. No secret values are printed into docs or committed source.
- **Data access:** TanStack Query over the api client; route loaders prime the cache. Since the Decisions Case Structures do not exist yet, calls fail cleanly into documented error states, and a `VITE_DEC_MODE=mock` fixture layer exists as a build/dev fallback only (default is real).
- **Design:** enterprise case-management aesthetic — dense, calm, high-contrast, semantic tokens in `src/styles.css`; no decorative UI. Not the default purple-on-white look.

## Documentation deliverables

- `docs/decisions-contract.json` — machine-readable contract: version, app name, namespace `EmployeeOnboarding`, Case Structures + fields (name, type, required, validation, source, purpose), enumerations, API inventory, request/response schemas, flows, rules, workflow stages/transitions, tasks, approvals, documents, signatures, notifications, SLAs/escalation, audit events, reports, backend dependencies.
- `docs/API-INVENTORY.md` — every endpoint: namespace, name, method, logical path, purpose, consuming screen, request, response, errors, auth, audit, examples. Naming follows `EmployeeOnboarding/GetAll`, `/GetById`, `/Create`, `/Submit`, `/Approve`, `/RequestChanges`, `/Reject`, `/CompleteTask`, etc.
- `docs/DATA-MODEL.md`, `docs/WORKFLOW.md`, `docs/RULES-AND-FLOWS.md`, `docs/NOTIFICATIONS-SLA-AUDIT.md`, `docs/DECISIONS-SETUP-CHECKLIST.md` (tickable), `docs/TRACEABILITY-MATRIX.md` (requirement → screen → API → case field → flow/rule → notification → audit event).
- `README.md` — the full required section list, including run/build, env configuration, mock vs real, error handling, testing and Decisions integration steps.
- Every assumption is labelled **RECOMMENDED IMPLEMENTATION** or **BUSINESS DECISION REQUIRED**; nothing invented is presented as a requirement.

## Build order

1. Design system, app shell, navigation, auth gate, Decisions api client + types + stores, env config.
2. Contract and data model docs (they define the API surface the UI codes against).
3. Cases list, intake wizard, case detail shell with stage timeline.
4. Approvals, documents, signatures, operational tasks, final review, completion.
5. Work queues, exceptions console, dashboard, reports.
6. Remaining docs, checklist, traceability matrix, README, head metadata and accessibility pass.

## Out of scope

No Decisions Flows, Rules or Case Structures are created here — this plan produces the front end plus the exact backend specification needed to build them in Decisions.
