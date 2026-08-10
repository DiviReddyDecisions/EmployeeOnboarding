# Data Model — EmployeeOnboarding

The case structure is the single source of truth. The front end mirrors it in
`src/api/types/` and never persists derived state locally.

## Structure map

```text
OnboardingCase
├── Employee            EmployeeInfo        (1:1, required)
├── Employment          EmploymentInfo      (1:1, required)
├── Compensation        CompensationInfo    (0:1)
├── RequirementsPlan    RequirementsPlan    (0:1, produced by DetermineRequirements)
├── ValidationIssues    ValidationIssue[]   (rule output)
├── Approvals           ApprovalItem[]      (sequenced)
├── Documents           DocumentRequirement[]
├── Signatures          SignatureRequest[]  (each references a DocumentRequirement.Id)
├── Tasks               OperationalTask[]
├── Checks              ComplianceCheck[]
├── Notifications       NotificationRecord[] (append-only)
├── AuditEvents         AuditEvent[]         (append-only, immutable)
├── Comments            Comment[]            (append-only)
└── Exception           CaseException        (0:1, current blocking exception)
```

## OnboardingCase

| Field | Type | Req | Validation | Source | Purpose |
| --- | --- | --- | --- | --- | --- |
| Id | GUID | Yes | — | System | Primary key |
| CaseNumber | String | Yes | `ONB-#####` | GenerateCaseNumber | Human reference |
| Stage | CaseStage | Yes | Enum | Workflow | Current stage |
| Status | CaseStatus | Yes | Enum | Workflow | Lifecycle status |
| Employee | EmployeeInfo | Yes | Child rules | HR input | Person onboarding |
| Employment | EmploymentInfo | Yes | Child rules | HR input + reference data | Org placement |
| Compensation | CompensationInfo | No | Child rules | HR input | Approval routing input |
| RequirementsPlan | RequirementsPlan | No | — | DetermineRequirements | Computed requirements |
| ValidationIssues | ValidationIssue[] | Yes | — | ValidateCase | Blocking/advisory problems |
| Approvals | ApprovalItem[] | Yes | Unique Sequence | BuildApprovalChain | Approval chain |
| Documents | DocumentRequirement[] | Yes | Unique DocumentType | DetermineRequirements | Document set |
| Signatures | SignatureRequest[] | Yes | DocumentId must exist | RequestSignatures | Envelopes |
| Tasks | OperationalTask[] | Yes | Unique TaskType | CreateOperationalTasks | Provisioning work |
| Checks | ComplianceCheck[] | Yes | Unique CheckType | DetermineRequirements | Compliance |
| Notifications | NotificationRecord[] | Yes | — | SendNotification | Outbound log |
| AuditEvents | AuditEvent[] | Yes | Append-only | All action flows | Audit trail |
| Comments | Comment[] | Yes | Text 1-2000 chars | AddComment | Collaboration |
| Exception | CaseException | No | — | Exception flows | Current blocker |
| OwnerName | String | Yes | — | Account service | Responsible HR owner |
| CreatedOn / UpdatedOn | DateTime | Yes | — | System | Timestamps |
| SubmittedOn | DateTime | No | — | Submit | First submission |
| CompletedOn | DateTime | No | — | Complete | Completion |
| DueOn | DateTime | No | — | SLA rule | Case SLA target |

## EmployeeInfo

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| FirstName | String | Yes | 1-50 chars |
| LastName | String | Yes | 1-50 chars |
| PreferredName | String | No | ≤50 chars |
| PersonalEmail | String | Yes | Email format; unique across open cases |
| Phone | String | No | E.164 recommended |
| Country | String | Yes | ISO country name/code |
| ExistingRecordId | String | No | Set by duplicate detection |

## EmploymentInfo

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| PositionId / PositionTitle | String | Yes | Must exist in `Positions` |
| DepartmentId / DepartmentName | String | Yes | Must exist in `Departments` |
| ManagerId / ManagerName | String | Yes | Manager department must equal case department |
| LocationId / LocationName | String | Yes | Must exist in `Locations` |
| EmploymentType | EmploymentType | Yes | Enum |
| StartDate | Date | Yes | ≥ today at submission |

Denormalised display names are stored alongside ids so historical cases stay readable
after reference data changes.

## CompensationInfo

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| BaseSalary | Decimal | Yes | > 0 |
| Currency | String | Yes | ISO 4217 |
| PayFrequency | Enum | Yes | Monthly / BiWeekly / Weekly / Hourly |
| BonusEligible | Boolean | Yes | — |
| BonusPercent | Decimal | Cond. | Required and 0-100 when `BonusEligible` |

## Child collections

**ApprovalItem** — `Id, Sequence, ApproverRole, ApproverName, Status, DueOn, DecidedOn, Comments`.
Only the lowest-`Sequence` `Pending` item is actionable. `Comments` required for
`ChangesRequested` and `Rejected`.

**DocumentRequirement** — `Id, DocumentType, Name, Required, Source (Generated|Supplied), Status, FileName, UploadedBy, UpdatedOn, ReviewNotes`.
`Generated` documents move `NotStarted → Generating → InReview → Complete`;
`Supplied` move `NotStarted → AwaitingUpload → InReview → Complete|Rejected`.

**SignatureRequest** — `Id, DocumentId, DocumentName, SignerName, SignerEmail, Status, SentOn, CompletedOn, DeclineReason`.
Created only for document types with `RequiresSignature = true`.

**OperationalTask** — `Id, TaskType, Name, Team, AssigneeName, Status, DueOn, CompletedOn, BlockedReason`.
`DueOn = Employment.StartDate + TaskTemplate.DefaultDueOffsetDays`.

**ComplianceCheck** — `Id, CheckType, Name, Status, CompletedOn, Notes`.
`Failed` blocks `FinalReview`; `Waived` requires a note.

**NotificationRecord** — `Id, Template, Subject, Recipient, Channel, SentOn, Status`. Append-only.

**AuditEvent** — `Id, EventType, Actor, OccurredOn, Detail`. Append-only and never edited or deleted.

**CaseException** — `Type, Reason, RaisedOn, RaisedBy, Resolvable`. `Resolvable = false` for
`Rejected` and `Cancelled`.

## Enumerations

See `enumerations` in `docs/decisions-contract.json`. Each must exist as a Decisions
enumeration or value list; the front-end unions in `src/api/types/Common.ts` mirror them
exactly and must be updated together.

## Reference data (read-only)

`Department`, `Position` (incl. `RequiresBackgroundCheck`), `LocationRecord`, `Manager`,
`DocumentTypeRef` (incl. `RequiresSignature`), `TaskTemplateRef` (incl. `DefaultDueOffsetDays`)
and `ApprovalMatrixRow` (`Condition`, `ApproverRole`, `Sequence`, `SlaHours`).
Owned by Decisions and surfaced read-only on `/reference`.

## Input payload

`OnboardingCaseInput` = `{ Id?, Employee, Employment, Compensation? }`. It is the only
shape the client sends for create/draft; all other fields are backend-owned.
