# Traceability Matrix — EmployeeOnboarding

Requirement → screen → API → case field → flow/rule → notification → audit event.

| # | Requirement | Screen | API | Case field(s) | Flow / rule | Notification | Audit event |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | HR captures a new hire's personal and employment details | `/cases/new` | `SaveDraft` | `Employee`, `Employment`, `Compensation` | — | — | `DraftSaved` |
| R2 | Drafts can be saved and resumed | `/cases/new`, `/cases/$caseId` | `SaveDraft`, `GetById` | `Id`, `Stage=Draft` | — | — | `DraftSaved` |
| R3 | Pickers use governed master data | `/cases/new`, `/reference` | `GetReferenceData` | `Employment.*Id/*Name` | reference data owned by Decisions | — | — |
| R4 | Submission validates data before work begins | `/cases/new`, `/cases/$caseId` | `Create`, `Submit` | `ValidationIssues`, `SubmittedOn` | `ValidateCase` + validation rule set | `CaseSubmitted`, `ValidationFailed` | `CaseSubmitted`, `ValidationCompleted` |
| R5 | Invalid cases return to HR with actionable messages | `/cases/$caseId`, `/exceptions` | `Create`, `Submit` | `Status=ChangesRequired`, `ValidationIssues` | `ValidateCase` | `ValidationFailed` | `ValidationCompleted` |
| R6 | Duplicate employees are detected | `/cases/new` | `Create` | `Employee.ExistingRecordId` | `Rule.DuplicateEmployee` | — | `ValidationCompleted` |
| R7 | Requirements are derived per case, not hard-coded | `/cases/$caseId` (Requirements) | `Create`, `Submit` | `RequirementsPlan` | `DetermineRequirements` + requirements rules | — | `RequirementsDetermined` |
| R8 | Approval routing follows the approval matrix | `/cases/$caseId`, `/approvals` | `Create`, `Submit` | `Approvals[]` | `BuildApprovalChain`, `Rule.BaseApprovals` | `ApprovalRequested` | `RequirementsDetermined` |
| R9 | High-value or senior hires need extra approval | `/approvals` | `Approve` | `Approvals[]` | `Rule.ExecutiveApproval`, `Rule.FinanceApproval` | `ApprovalRequested` | `ApprovalApproved` |
| R10 | Approvers approve with optional comments | `/approvals`, `/cases/$caseId` | `Approve` | `Approvals[].Status/DecidedOn/Comments` | approval guard | `ApprovalRequested` (next), `ReadyForFinalReview` | `ApprovalApproved` |
| R11 | Approvers can send a case back for changes | `/approvals` | `RequestChanges` | `Status`, `Exception`, `Approvals[].Comments` | approval guard | `ChangesRequested` | `ApprovalChangesRequested` |
| R12 | Approvers can reject a case outright | `/approvals` | `Reject` | `Status=Rejected`, `Exception` | approval guard | `CaseRejected` | `ApprovalRejected` |
| R13 | Required documents are generated from templates | `/cases/$caseId` (Documents) | `UpdateDocument` | `Documents[]` where `Source=Generated` | `GenerateDocuments` | — | `DocumentStatusChanged` |
| R14 | Supplied documents can be uploaded and reviewed | `/cases/$caseId` | `UpdateDocument` | `Documents[].Status/FileName/ReviewNotes` | document guard | `DocumentRequested` | `DocumentStatusChanged` |
| R15 | Contractors get contractor paperwork, not offer letters | `/cases/$caseId` | `Create` | `Documents[]`, `RequirementsPlan.Rationale` | `Rule.ContractorDocuments` | — | `RequirementsDetermined` |
| R16 | Signature-bearing documents are e-signed | `/cases/$caseId` (Signatures) | `UpdateSignature` | `Signatures[]` | `RequestSignatures` | `SignatureRequest`, `SignatureReminder` | `SignatureStatusChanged` |
| R17 | Declined signatures raise an exception | `/exceptions` | `UpdateSignature` | `Signatures[].DeclineReason`, `Exception` | signature guard | `SignatureDeclined` | `SignatureStatusChanged` |
| R18 | IT, Facilities and Payroll work is assigned automatically | `/tasks`, `/cases/$caseId` | `UpdateTask` | `Tasks[]` | `CreateOperationalTasks` | `TaskAssigned` | `TaskStatusChanged` |
| R19 | Task due dates derive from the start date | `/tasks` | — | `Tasks[].DueOn` | SLA rule + `TaskTemplate.DefaultDueOffsetDays` | `TaskOverdue` | `SlaEscalated` |
| R20 | Assignees can start, block and complete tasks | `/tasks` | `UpdateTask` | `Tasks[].Status/BlockedReason/CompletedOn` | task guard | — | `TaskStatusChanged` |
| R21 | Remote hires get equipment shipped instead of a desk | `/cases/$caseId` | `Create` | `Tasks[]` | `Rule.RemoteEquipment` | `TaskAssigned` | `RequirementsDetermined` |
| R22 | Background checks run where the position requires them | `/cases/$caseId` (Checks) | `GetById` | `Checks[]` | `Rule.BackgroundCheckRequired` | — | `CheckStatusChanged` |
| R23 | International hires get work-authorisation compliance | `/cases/$caseId` | `Create` | `Checks[]`, `Documents[]` | `Rule.InternationalCompliance` | — | `RequirementsDetermined` |
| R24 | HR Manager performs a final review before completion | `/cases/$caseId` | `Complete` | `Stage=FinalReview→Completed`, `CompletedOn` | completion guard (`HRManager`) | `ReadyForFinalReview`, `CaseCompleted` | `CaseCompleted` |
| R25 | Cases can be put on hold and resumed | `/cases/$caseId` | `ChangeStatus` | `Status=OnHold`, `Exception` | status guard; SLA clocks pause | `CaseOnHold` | `StatusChanged` |
| R26 | Cases can be cancelled with a reason | `/cases/$caseId` | `ChangeStatus` | `Status=Cancelled` | status guard (`HRManager`) | `CaseCancelled` | `StatusChanged` |
| R27 | Stakeholders collaborate on a case | `/cases/$caseId` | `AddComment` | `Comments[]` | — | — | `CommentAdded` |
| R28 | Overdue work is escalated, not silently late | `/exceptions`, `/reports` | `GetAll`, `GetReports` | `DueOn`, `Exception`, `Notifications[]` | `EscalateOverdue` | `ApprovalEscalated`, `TaskOverdue` | `SlaEscalated` |
| R29 | HR sees a prioritised view of what needs attention | `/` | `GetDashboardKpis`, `GetStageCounts`, `GetAll` | `Stage`, `Status`, `DueOn` | `ComputeKpis` | — | — |
| R30 | Approvers see only their pending decisions | `/approvals` | `GetAll` | `Approvals[].ApproverName/Status/Sequence` | role scoping | `ApprovalRequested` | `ApprovalApproved` |
| R31 | Assignees see only their team's open tasks | `/tasks` | `GetAll` | `Tasks[].Team/AssigneeName/Status` | role scoping | `TaskAssigned` | `TaskStatusChanged` |
| R32 | Management can measure cycle time and SLA health | `/reports` | `GetReports`, `GetDashboardKpis` | derived from cases + audit events | `ComputeReports` | — | — |
| R33 | Every action is attributable and auditable | `/cases/$caseId` (Timeline) | all action endpoints | `AuditEvents[]` | `WriteAuditEvent` | — | all events |
| R34 | Every notification sent is recorded | `/cases/$caseId` (Notifications) | `GetById` | `Notifications[]` | `SendNotification` | all templates | `NotificationSent` |
| R35 | Access is role-based and enforced server-side | all screens | `GetCurrentAccount`, `GetCurrentUserRoles` | — | group→role mapping; endpoint guards | — | — |
| R36 | Master data is visible but not editable in the app | `/reference` | `GetReferenceData` | — | reference data owned by Decisions | — | — |
| R37 | A degraded backend is obvious, never silently faked | app shell banner | all | — | `withFallback` + `backendStatus` | — | — |

## Coverage notes

- Every screen in `src/routes/` appears at least once: `/`, `/cases`, `/cases/new`,
  `/cases/$caseId`, `/approvals`, `/tasks`, `/exceptions`, `/reports`, `/reference`.
- Every endpoint in `docs/API-INVENTORY.md` appears at least once.
- Every audit event in `docs/NOTIFICATIONS-SLA-AUDIT.md` is traced to a requirement.
- Requirements R1-R37 collectively cover the stages in `docs/WORKFLOW.md`; each stage has
  at least one entry requirement and one exit requirement.
