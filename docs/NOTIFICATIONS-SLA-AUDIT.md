# Notifications, SLAs and Audit — EmployeeOnboarding

## Notifications

Sent by `EmployeeOnboarding/SendNotification`, which logs a `NotificationRecord`
(`Template`, `Subject`, `Recipient`, `Channel`, `SentOn`, `Status`) on the case.
Failures are logged with `Status: "Failed"` and retried up to three times.

| Template | Trigger | Recipients | Channel | Subject |
| --- | --- | --- | --- | --- |
| `CaseSubmitted` | `Submit` / `Create` | HR owner | Email | Onboarding case {CaseNumber} submitted |
| `ValidationFailed` | Error issues found | HR owner | Email + InApp | Action needed: {CaseNumber} validation issues |
| `ApprovalRequested` | Approval becomes current | Current approver | Email + InApp | Approval needed: {Employee} — {PositionTitle} |
| `ApprovalReminder` | 50% of approval SLA elapsed | Current approver | Email | Reminder: approval pending for {CaseNumber} |
| `ApprovalEscalated` | Approval SLA breached | HR Manager | Email | Escalation: approval overdue on {CaseNumber} |
| `ChangesRequested` | `RequestChanges` | HR owner | Email + InApp | Changes requested on {CaseNumber} |
| `CaseRejected` | `Reject` | HR owner, hiring manager | Email | Onboarding {CaseNumber} rejected |
| `DocumentRequested` | Supplied document set to `AwaitingUpload` | HR owner | Email | Documents needed for {CaseNumber} |
| `SignatureRequest` | Signature sent | Signer | Email | Please sign: {DocumentName} |
| `SignatureReminder` | 48h unsigned | Signer | Email | Reminder: {DocumentName} awaiting signature |
| `SignatureDeclined` | Signature declined | HR owner | Email + InApp | Signature declined on {CaseNumber} |
| `TaskAssigned` | Task created | Assignee team | Email + InApp | New onboarding task: {Task.Name} |
| `TaskOverdue` | Past `DueOn` | Assignee + team lead | Email | Overdue task: {Task.Name} ({CaseNumber}) |
| `CaseOnHold` | `ChangeStatus` → `OnHold` | HR owner, hiring manager | Email | {CaseNumber} placed on hold |
| `CaseCancelled` | `ChangeStatus` → `Cancelled` | HR owner, hiring manager, open task assignees | Email | {CaseNumber} cancelled |
| `ReadyForFinalReview` | Operational prep complete | HR Manager | Email + InApp | {CaseNumber} ready for final review |
| `CaseCompleted` | `Complete` | HR owner, hiring manager, employee | Email | Welcome aboard — {Employee} onboarding complete |

Channel notes: `InApp` records are read by the dashboard; `SMS` is reserved for
start-date-critical reminders and is off by default.

## SLAs

| Item | Target | Source |
| --- | --- | --- |
| Approval step | `ApprovalMatrix.SlaHours` (default 24h) | Reference data |
| Generated document | 48h from stage entry | Policy constant |
| Supplied document | 72h from request | Policy constant |
| Signature | 72h from send, envelope expires at 14 days | Policy constant |
| Operational task | `StartDate + DefaultDueOffsetDays` | Task template |
| Compliance check | 5 business days from creation | Policy constant |
| Whole case | `StartDate - 1 day` | Derived (`DueOn`) |

### SLA states

`OnTrack` → more than 24h remaining. `DueSoon` → within 24h. `Overdue` → past `DueOn`.
`NotApplicable` → item closed or case on hold. Computed for display in
`src/lib/case-utils.ts`; authoritative values come from the backend.

### Escalation ladder

`EmployeeOnboarding/EscalateOverdue` runs hourly:

1. **50% of SLA elapsed** — reminder to the current assignee (`ApprovalReminder` / `SignatureReminder`).
2. **SLA breached** — notify assignee and escalate to HR Manager (`ApprovalEscalated` / `TaskOverdue`); audit `SlaEscalated`.
3. **Breach + 24h** — raise an `Overdue` `CaseException` so the case appears on `/exceptions`.
4. **Breach + 72h** — escalate to HR Director and flag the case in `SlaBreaches` reporting.

Clocks pause while `Status = OnHold` and resume on resume.

## Audit

`WriteAuditEvent` appends to `AuditEvents` on every action endpoint. Records are
immutable — never updated or deleted — and carry `Actor` (Decisions account),
`OccurredOn` (UTC) and a human-readable `Detail`.

| Event type | Raised by | Detail contents |
| --- | --- | --- |
| `CaseCreated` | Create / SaveDraft | Case number, employee, position |
| `DraftSaved` | SaveDraft | Fields changed |
| `CaseSubmitted` | Submit / Create | Submitted by, timestamp |
| `ValidationCompleted` | ValidateCase | Issue counts by severity |
| `RequirementsDetermined` | DetermineRequirements | Rationale lines |
| `ApprovalApproved` | Approve | Approver, role, sequence, comments |
| `ApprovalChangesRequested` | RequestChanges | Approver, required changes |
| `ApprovalRejected` | Reject | Approver, reason |
| `DocumentStatusChanged` | UpdateDocument | Document, old → new status, file name |
| `SignatureStatusChanged` | UpdateSignature | Signer, old → new status, decline reason |
| `TaskStatusChanged` | UpdateTask | Task, team, old → new status, blocked reason |
| `CheckStatusChanged` | Check integration | Check type, outcome, notes |
| `StatusChanged` | ChangeStatus | Old → new status, reason |
| `CommentAdded` | AddComment | Author, text |
| `NotificationSent` | SendNotification | Template, recipient, channel, result |
| `SlaEscalated` | EscalateOverdue | Item, breach duration, escalated to |
| `CaseCompleted` | Complete | Completed by, cycle time |

### Retention and access

Audit and notification history is retained for seven years to satisfy employment-record
requirements. The `Auditor` role has read-only access to case history and reports and
cannot invoke any action endpoint. The case timeline on `/cases/$caseId` renders
`AuditEvents` in reverse chronological order.
