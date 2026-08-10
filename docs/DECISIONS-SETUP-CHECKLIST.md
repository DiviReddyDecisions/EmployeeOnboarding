# Decisions Setup Checklist

Work top to bottom. Each item is verifiable in the Decisions Studio or with a REST call.

## 1. Environment and project

- [ ] Create the Decisions project/folder `EmployeeOnboarding`.
- [ ] Note the portal base URL → front-end `VITE_DEC_PORTAL_BASE`.
- [ ] Note the project API base path → `VITE_DEC_PROJECT_API_BASE_URL`.
- [ ] Confirm `VITE_DEC_NAMESPACE=employeeonboarding` matches the REST namespace.
- [ ] Enable JWT bearer authentication for REST API calls.
- [ ] Set `VITE_DEC_MODE=real` once endpoints are live (`mock` keeps the local data set).

## 2. Accounts, groups and roles

- [ ] Create groups: HR Specialists, HR Managers, Approvers, Task Assignees, Signers, Auditors.
- [ ] Map each group to an app role (`HRSpecialist`, `HRManager`, `Approver`, `TaskAssignee`, `Signer`, `Auditor`).
- [ ] Build flow `GetCurrentUserRoles` returning `AppRole[]` from the caller's groups.
- [ ] Verify `GET /REST/AccountService/GetCurrentAccount` returns `Groups`.

## 3. Enumerations / value lists

- [ ] `CaseStage` (9 values)
- [ ] `CaseStatus` (8 values)
- [ ] `ApprovalStatus`, `DocumentStatus`, `SignatureStatus`, `TaskStatus`, `CheckStatus`
- [ ] `ExceptionType`, `EmploymentType`, `NotificationChannel`, `SlaState`
- [ ] Values match `docs/decisions-contract.json` exactly (spelling is contractual).

## 4. Case structures

- [ ] `OnboardingCase` with all fields from `docs/DATA-MODEL.md`.
- [ ] Extensions: `EmployeeInfo`, `EmploymentInfo`, `CompensationInfo`, `RequirementsPlan`.
- [ ] Child structures: `ApprovalItem`, `DocumentRequirement`, `SignatureRequest`, `OperationalTask`, `ComplianceCheck`, `NotificationRecord`, `AuditEvent`, `Comment`, `CaseException`, `ValidationIssue`.
- [ ] `AuditEvents`, `Notifications` and `Comments` configured as append-only.
- [ ] Generate the `OnboardingCase` Case Data Service (`GetAll`, `GetById`, `SaveOrCreate`).

## 5. Reference data

- [ ] Departments populated.
- [ ] Positions populated with `DepartmentId` and `RequiresBackgroundCheck`.
- [ ] Locations populated with `Country`.
- [ ] Managers populated with `DepartmentId`.
- [ ] Document types populated with `Source` and `RequiresSignature`.
- [ ] Task templates populated with `Team` and `DefaultDueOffsetDays`.
- [ ] Approval matrix populated (`Condition`, `ApproverRole`, `Sequence`, `SlaHours`).
- [ ] Flow `GetReferenceData` returns all seven collections.

## 6. Rules

- [ ] Validation rule set `ValidateCase` — all ten rules in `docs/RULES-AND-FLOWS.md`.
- [ ] Requirements rules — all thirteen rules, each appending to `Rationale`.
- [ ] SLA calculation rule for `DueOn` on cases, approvals and tasks.

## 7. Flows

- [ ] `GenerateCaseNumber`
- [ ] `ValidateCase`
- [ ] `DetermineRequirements`
- [ ] `BuildApprovalChain`
- [ ] `GenerateDocuments`
- [ ] `RequestSignatures`
- [ ] `CreateOperationalTasks`
- [ ] `SendNotification`
- [ ] `EscalateOverdue` (scheduled hourly)
- [ ] `WriteAuditEvent`
- [ ] `ComputeKpis`
- [ ] `ComputeReports`

## 8. Action endpoints (exposed as REST)

- [ ] `savedraft`
- [ ] `create`
- [ ] `submit`
- [ ] `approve`
- [ ] `requestchanges` (comments required)
- [ ] `reject` (comments required)
- [ ] `updatedocument`
- [ ] `updatesignature`
- [ ] `updatetask`
- [ ] `complete` (HRManager only)
- [ ] `changestatus`
- [ ] `addcomment`
- [ ] `getreferencedata`
- [ ] `getdashboardkpis`
- [ ] `getstagecounts`
- [ ] `getreports`
- [ ] `getcurrentuserroles`
- [ ] Every action returns the full updated case under `Done`.
- [ ] Every action writes an audit event.
- [ ] Every action enforces role, stage and item-level guards (403 / 409, no partial writes).

## 9. Integrations

- [ ] Document template engine wired to `GenerateDocuments`.
- [ ] E-signature provider wired to `RequestSignatures`, with status callbacks into `updatesignature`.
- [ ] SMTP / notification provider configured and tested.
- [ ] Background-check provider wired to compliance checks (or manual entry accepted).
- [ ] HRIS/directory lookup for duplicate detection.

## 10. Notifications and SLA

- [ ] All 18 notification templates created with the subjects in `docs/NOTIFICATIONS-SLA-AUDIT.md`.
- [ ] Reminder at 50% SLA, escalation at breach, exception at breach + 24h, director escalation at breach + 72h.
- [ ] SLA clocks pause on `OnHold`.

## 11. Reporting

- [ ] `StageAging`, `ApprovalTurnaround`, `TaskCompletionByTeam`, `CycleTimeByDepartment`, `SlaBreaches`.
- [ ] KPIs are user-scoped for `AwaitingMyApproval` and `MyOpenTasks`.
- [ ] Auditor role has read access to reports and no write access.

## 12. Front-end verification

- [ ] `.env` values set; app shell shows "Connected" instead of the fallback banner.
- [ ] `/cases/new` pickers populate from `GetReferenceData`.
- [ ] Submit a case end to end: draft → approvals → documents → signatures → tasks → complete.
- [ ] Approve, request changes and reject each behave as documented.
- [ ] `/approvals`, `/tasks`, `/exceptions`, `/reports`, `/reference` all render live data.
- [ ] Case timeline shows audit events for every action taken.
- [ ] A user without a role sees no action buttons and receives `403` if calling directly.
