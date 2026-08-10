# Workflow — EmployeeOnboarding

Nine stages, driven entirely by Decisions. The UI reflects stage and status; it never
computes a transition.

```text
Draft ──Submit──► Validation ──pass──► RequirementsDetermination ──► Approvals
  ▲                   │                                                 │
  │              errors│                                    Approve all │
  │                    ▼                                                ▼
  └──ChangesRequired───┘                                          Documents
  ▲                                                                    │
  │                                                          all complete
  │                                                                    ▼
  ├────────RequestChanges──────────────────────────────────────── Signatures
  │                                                                    │
  │                                                            all signed
  │                                                                    ▼
  │                                                     OperationalPreparation
  │                                                                    │
  │                                           tasks done + checks clear
  │                                                                    ▼
  │                                                             FinalReview
  │                                                                    │
  │                                                    Complete (HRManager)
  │                                                                    ▼
  └───────────────────────────────────────────────────────────── Completed

Any stage ──ChangeStatus──► OnHold ──resume──► previous stage
Any stage ──ChangeStatus──► Cancelled (terminal)
Approvals ──Reject──► Rejected (terminal)
```

## Stages

| Stage | Owner | Entry condition | Exit condition |
| --- | --- | --- | --- |
| Draft | HR Specialist | Case created | `Submit` invoked |
| Validation | System | Submit | No `Error` validation issues |
| RequirementsDetermination | System | Validation passed | `RequirementsPlan` produced and children materialised |
| Approvals | Approvers | Requirements determined | All approvals `Approved` or `Skipped` |
| Documents | HR Specialist | Approvals complete | All `Required` documents `Complete` |
| Signatures | Signers | Documents complete | All signatures `Signed` |
| OperationalPreparation | Task assignees | Signatures complete | All tasks `Complete`/`Cancelled` and checks `Passed`/`Waived` |
| FinalReview | HR Manager | Operational prep complete | `Complete` invoked |
| Completed | — | Complete | Terminal |

## Transitions

| From | To | Trigger (endpoint) | Guard | Effects |
| --- | --- | --- | --- | --- |
| Draft | Validation | `Submit` / `Create` | Case owner, `HRSpecialist` | `SubmittedOn` set; audit `CaseSubmitted` |
| Validation | RequirementsDetermination | automatic | No error issues | audit `ValidationCompleted` |
| Validation | Draft | automatic | Error issues exist | `Status = ChangesRequired`; issues surfaced in UI |
| RequirementsDetermination | Approvals | automatic | Plan produced | Approvals/documents/tasks/checks created; audit `RequirementsDetermined` |
| Approvals | Approvals | `Approve` | Assigned approver, current sequence | Next approver notified; audit `ApprovalApproved` |
| Approvals | Documents | `Approve` (last step) | All prior approved | `GenerateDocuments` starts |
| Approvals | Draft | `RequestChanges` | Assigned approver, comments present | `Status = ChangesRequired`; exception raised |
| Approvals | — (terminal) | `Reject` | Assigned approver, comments present | `Status = Rejected`; non-resolvable exception |
| Documents | Signatures | `UpdateDocument` (last required) | All required complete | `RequestSignatures` runs |
| Signatures | OperationalPreparation | `UpdateSignature` (last) | All signed | `CreateOperationalTasks` runs |
| OperationalPreparation | FinalReview | `UpdateTask` (last) | Tasks and checks cleared | HR Manager notified |
| FinalReview | Completed | `Complete` | `HRManager` role | `CompletedOn` set; audit `CaseCompleted` |
| Any | OnHold | `ChangeStatus` | `HRSpecialist`/`HRManager`, reason required | Stage preserved; SLA clocks paused |
| OnHold | previous | `ChangeStatus` (`InProgress`) | same | SLA clocks resume |
| Any | Cancelled | `ChangeStatus` (`Cancelled`) | `HRManager`, reason required | Open tasks cancelled; terminal |

## Status semantics

| Status | Meaning | UI treatment |
| --- | --- | --- |
| Draft | Not yet submitted | Editable form |
| InProgress | Normal progress | Neutral pill |
| ChangesRequired | Returned to HR | Warning pill, exception banner, appears on `/exceptions` |
| OnHold | Paused deliberately | Muted pill, actions hidden except resume/cancel |
| Rejected | Terminated by approver | Destructive pill, read-only |
| Cancelled | Withdrawn by HR | Muted pill, read-only |
| Failed | Flow/integration failure | Destructive pill, appears on `/exceptions` |
| Completed | Onboarding done | Success pill, read-only |

## Role permissions

| Action | HRSpecialist | HRManager | Approver | TaskAssignee | Signer | Auditor |
| --- | --- | --- | --- | --- | --- | --- |
| Create / save draft | ✔ | ✔ | | | | |
| Submit | ✔ | ✔ | | | | |
| Approve / request changes / reject | | ✔ | ✔ | | | |
| Update documents | ✔ | ✔ | | | | |
| Sign | | | | | ✔ | |
| Update tasks | | ✔ | | ✔ | | |
| Complete | | ✔ | | | | |
| Hold / resume | ✔ | ✔ | | | | |
| Cancel | | ✔ | | | | |
| Read reports | ✔ | ✔ | | | | ✔ |

Permissions are enforced in Decisions. The UI hides unavailable actions as a convenience only.

## Exception handling

- `ChangesRequired` — resolvable; HR edits and resubmits.
- `OnHold` — resolvable; resume restores the prior stage.
- `Overdue` — raised by `EscalateOverdue` 24h past a breached SLA; resolvable by completing the item.
- `Failure` — integration/flow error; resolvable by retrying the failing step.
- `Rejected` / `Cancelled` — terminal, not resolvable.

All exceptions surface on `/exceptions` alongside overdue approvals and tasks.
