# Rules and Flows — EmployeeOnboarding

All business logic lives in Decisions. The front end submits intent and renders results.

## Validation rule set — `EmployeeOnboarding/ValidateCase`

Runs on `Submit` and `Create`. Output: `ValidationIssues[]` with `Field`, `Message`, `Severity`.
Any `Error` blocks the transition out of `Validation`.

| Rule | Expression | Severity | Message |
| --- | --- | --- | --- |
| `Rule.RequiredFields` | all required Employee/Employment fields present | Error | "<Field> is required." |
| `Rule.EmailFormat` | `PersonalEmail` matches email pattern | Error | "Personal email is not a valid address." |
| `Rule.StartDateNotPast` | `StartDate >= Today` | Error | "Start date cannot be in the past." |
| `Rule.StartDateLeadTime` | `StartDate - Today < 10 days` | Warning | "Short lead time — provisioning may be expedited." |
| `Rule.DuplicateEmployee` | email matches an open case or employee record | Warning | "A matching employee record already exists." Sets `ExistingRecordId`. |
| `Rule.ManagerInDepartment` | `Manager.DepartmentId = Employment.DepartmentId` | Error | "Manager does not belong to the selected department." |
| `Rule.PositionInDepartment` | `Position.DepartmentId = Employment.DepartmentId` | Error | "Position does not belong to the selected department." |
| `Rule.BonusPercentRequired` | `BonusEligible` implies `BonusPercent > 0` | Error | "Bonus percentage is required for bonus-eligible roles." |
| `Rule.SalaryPositive` | `BaseSalary > 0` | Error | "Base salary must be greater than zero." |
| `Rule.LocationCountryMatch` | `Employee.Country = Location.Country` | Warning | "Employee country differs from work location — compliance checks added." |

## Requirements rules — `EmployeeOnboarding/DetermineRequirements`

Runs after validation passes. Produces `RequirementsPlan` and materialises approvals,
documents, checks and tasks. Every added requirement appends a line to `Rationale`.

| Rule | Condition | Outcome |
| --- | --- | --- |
| `Rule.BaseApprovals` | always | Hiring Manager, then HR Manager |
| `Rule.ExecutiveApproval` | `BaseSalary > 150000` or title contains "Director"/"VP" | Add HR Director and Finance approvals |
| `Rule.FinanceApproval` | `BonusEligible = true` | Add Finance approval |
| `Rule.BaseDocuments` | always | `NDA`, `POLICY_ACK`, `ID_PROOF`, `TAX_FORM` |
| `Rule.EmployeeOffer` | `EmploymentType <> Contract` | Add `OFFER_LETTER` (signature required) |
| `Rule.ContractorDocuments` | `EmploymentType = Contract` | Add `CONTRACTOR_AGREEMENT`; skip `PAYROLL_ENROL` and `BENEFITS_ENROL` |
| `Rule.BackgroundCheckRequired` | `Position.RequiresBackgroundCheck` | Add `BackgroundCheck` |
| `Rule.InternationalCompliance` | `Employee.Country <> Location.Country` | Add `WorkAuthorisation` check and `WORK_AUTH` document |
| `Rule.RemoteEquipment` | location name contains "Remote" | Add `SHIP_EQUIPMENT`; skip `DESK_SETUP` and `BADGE` |
| `Rule.OnsiteEquipment` | location is physical | Add `DESK_SETUP` and `BADGE` |
| `Rule.BaseTasks` | always | `IT_ACCOUNT`, `IT_HARDWARE`, `ORIENTATION` |
| `Rule.InternScope` | `EmploymentType = Intern` | Skip `BENEFITS_ENROL`; single approval level |
| `Rule.SignatureSet` | document type has `RequiresSignature` | Add to `RequiredSignatureDocumentTypes` |

## Flow inventory

| Flow | Trigger | Inputs | Outputs / effects |
| --- | --- | --- | --- |
| `GenerateCaseNumber` | Case created | — | `CaseNumber` (`ONB-#####`) |
| `ValidateCase` | Submit / Create | Case | `ValidationIssues`; stage decision |
| `DetermineRequirements` | Validation passed | Case, reference data | `RequirementsPlan`; child collections |
| `BuildApprovalChain` | DetermineRequirements | `RequiredApprovalRoles`, approval matrix | `ApprovalItem[]` with `Sequence` and `DueOn` |
| `GenerateDocuments` | Approvals complete | `Documents` where `Source = Generated` | Documents move to `InReview`; templates rendered |
| `RequestSignatures` | Documents complete | `RequiredSignatureDocumentTypes` | `SignatureRequest[]`; provider envelopes sent |
| `CreateOperationalTasks` | Signatures complete | `RequiredTaskTypes`, task templates, `StartDate` | `OperationalTask[]` with `DueOn` and assignee team |
| `SendNotification` | Any stage/status change | Template, recipient, channel | Provider send + `NotificationRecord` |
| `EscalateOverdue` | Scheduled hourly | Open approvals, tasks, signatures | Reminders, escalations, `Overdue` exceptions, audit `SlaEscalated` |
| `WriteAuditEvent` | Every action endpoint | Actor, event type, detail | Appends `AuditEvent` |
| `ComputeKpis` | `GetDashboardKpis` | Cases, current account | `KpiSummary` |
| `ComputeReports` | `GetReports` | Cases, audit events | `ReportSet` |

## Action endpoint guards

Each write endpoint applies, in order: authenticate → resolve roles → check role permission
(see WORKFLOW.md) → check stage/status guard → check item-level guard (e.g. approval is the
current sequence, task assignee matches) → mutate → audit → notify → return the full case.

A guard failure returns `403` or `409` and mutates nothing. The client re-fetches on failure
so the UI cannot drift from backend state.

## Client-side fallback boundary

`src/api/apiclient.ts` falls back to a local reference data set when Decisions is unreachable
so the UI stays inspectable. The fallback replays representative data only — it never
evaluates a rule, computes an approval chain, or decides a transition. `backendStatus.ts`
surfaces the degraded state in the app shell so no one mistakes fallback output for a real decision.
