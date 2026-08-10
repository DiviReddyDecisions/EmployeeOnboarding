import type { CurrentUser } from "../types/Account";
import type { KpiSummary, ReportSet, StageCount } from "../types/Reports";
import type {
  OnboardingCase,
  OnboardingCaseInput,
} from "../types/OnboardingCase";
import type { ReferenceData } from "../types/ReferenceData";
import { buildCases, buildReferenceData } from "./fixtures";

/**
 * Local, in-memory stand-in for the Decisions backend.
 *
 * It exists so the UI can be built and reviewed before the Case Structures and
 * Flows in docs/decisions-contract.json are created in Decisions. It replicates
 * only enough behaviour to exercise the screens; the real decisions (which
 * approvals, which documents, SLA, escalation, audit authority) belong to
 * Decisions and are documented as backend requirements, not implemented here.
 */

let cases: OnboardingCase[] | null = null;
let reference: ReferenceData | null = null;
let sequence = 1008;

function state(): OnboardingCase[] {
  if (!cases) cases = buildCases();
  return cases;
}

function referenceData(): ReferenceData {
  if (!reference) reference = buildReferenceData();
  return reference;
}

function nowIso() {
  return new Date().toISOString();
}

function touch(item: OnboardingCase, eventType: string, detail: string, actor = "current.user") {
  item.UpdatedOn = nowIso();
  item.AuditEvents = [
    ...item.AuditEvents,
    {
      Id: `aud-${item.AuditEvents.length + 1}-${eventType}`,
      EventType: eventType,
      Actor: actor,
      OccurredOn: nowIso(),
      Detail: detail,
    },
  ];
}

function find(id: string): OnboardingCase {
  const item = state().find((entry) => entry.Id === id || entry.CaseNumber === id);
  if (!item) throw new Error(`Onboarding case ${id} was not found.`);
  return item;
}

export const mockBackend = {
  getCurrentUser(): CurrentUser {
    return {
      Account: {
        EmailAddress: "sarah.whitfield@contoso.com",
        DisplayName: "Sarah Whitfield",
        AccountId: "acct-hr-01",
        Groups: ["HR Specialists", "HR Managers", "Approvers"],
      },
      DisplayName: "Sarah Whitfield",
      Email: "sarah.whitfield@contoso.com",
      Roles: ["HRSpecialist", "HRManager", "Approver", "TaskAssignee", "Auditor"],
    };
  },

  getAll(): OnboardingCase[] {
    return state().map((item) => ({ ...item }));
  },

  getById(id: string): OnboardingCase {
    return { ...find(id) };
  },

  getReferenceData(): ReferenceData {
    return referenceData();
  },

  create(input: OnboardingCaseInput, submit: boolean): OnboardingCase {
    sequence += 1;
    const id = `case-${sequence}`;
    const created: OnboardingCase = {
      Id: id,
      CaseNumber: `ONB-${sequence}`,
      Stage: submit ? "Validation" : "Draft",
      Status: submit ? "InProgress" : "Draft",
      Employee: input.Employee,
      Employment: input.Employment,
      Compensation: input.Compensation ?? null,
      RequirementsPlan: null,
      ValidationIssues: [],
      Approvals: [],
      Documents: [],
      Signatures: [],
      Tasks: [],
      Checks: [],
      Notifications: [],
      AuditEvents: [
        {
          Id: "aud-1",
          EventType: "CaseCreated",
          Actor: "current.user",
          OccurredOn: nowIso(),
          Detail: `Onboarding case created for ${input.Employee.FirstName} ${input.Employee.LastName}.`,
        },
      ],
      Comments: [],
      Exception: null,
      OwnerName: "Sarah Whitfield",
      CreatedOn: nowIso(),
      UpdatedOn: nowIso(),
      SubmittedOn: submit ? nowIso() : null,
      CompletedOn: null,
      DueOn: null,
    };
    state().unshift(created);
    return { ...created };
  },

  submit(id: string): OnboardingCase {
    const item = find(id);
    item.Stage = "Validation";
    item.Status = "InProgress";
    item.SubmittedOn = nowIso();
    touch(item, "CaseSubmitted", "Request submitted for validation.");
    return { ...item };
  },

  decideApproval(
    id: string,
    approvalId: string,
    decision: "Approve" | "RequestChanges" | "Reject",
    comments: string,
  ): OnboardingCase {
    const item = find(id);
    item.Approvals = item.Approvals.map((approval) =>
      approval.Id === approvalId
        ? {
            ...approval,
            Status:
              decision === "Approve"
                ? ("Approved" as const)
                : decision === "Reject"
                  ? ("Rejected" as const)
                  : ("ChangesRequested" as const),
            DecidedOn: nowIso(),
            Comments: comments || null,
          }
        : approval,
    );
    if (decision === "Reject") {
      item.Status = "Rejected";
      item.Exception = {
        Type: "Rejected",
        Reason: comments || "Rejected by approver.",
        RaisedOn: nowIso(),
        RaisedBy: "current.user",
        Resolvable: false,
      };
    } else if (decision === "RequestChanges") {
      item.Status = "ChangesRequired";
      item.Exception = {
        Type: "ChangesRequired",
        Reason: comments || "Changes requested by approver.",
        RaisedOn: nowIso(),
        RaisedBy: "current.user",
        Resolvable: true,
      };
    }
    touch(item, `Approval${decision}`, comments || `Approval decision: ${decision}.`);
    return { ...item };
  },

  updateDocument(id: string, documentId: string, status: string, fileName?: string): OnboardingCase {
    const item = find(id);
    item.Documents = item.Documents.map((doc) =>
      doc.Id === documentId
        ? {
            ...doc,
            Status: status as typeof doc.Status,
            FileName: fileName ?? doc.FileName ?? null,
            UpdatedOn: nowIso(),
          }
        : doc,
    );
    touch(item, "DocumentUpdated", `Document ${documentId} set to ${status}.`);
    return { ...item };
  },

  updateSignature(id: string, signatureId: string, status: string): OnboardingCase {
    const item = find(id);
    item.Signatures = item.Signatures.map((sig) =>
      sig.Id === signatureId
        ? {
            ...sig,
            Status: status as typeof sig.Status,
            SentOn: status === "Sent" ? nowIso() : (sig.SentOn ?? null),
            CompletedOn: status === "Signed" ? nowIso() : (sig.CompletedOn ?? null),
          }
        : sig,
    );
    touch(item, "SignatureUpdated", `Signature ${signatureId} set to ${status}.`);
    return { ...item };
  },

  updateTask(id: string, taskId: string, status: string, reason?: string): OnboardingCase {
    const item = find(id);
    item.Tasks = item.Tasks.map((task) =>
      task.Id === taskId
        ? {
            ...task,
            Status: status as typeof task.Status,
            CompletedOn: status === "Complete" ? nowIso() : (task.CompletedOn ?? null),
            BlockedReason: status === "Blocked" ? (reason ?? "Blocked") : null,
          }
        : task,
    );
    touch(item, "TaskUpdated", `Task ${taskId} set to ${status}.`);
    return { ...item };
  },

  complete(id: string): OnboardingCase {
    const item = find(id);
    item.Stage = "Completed";
    item.Status = "Completed";
    item.CompletedOn = nowIso();
    item.Exception = null;
    touch(item, "CaseCompleted", "Onboarding completed by HR.");
    return { ...item };
  },

  changeStatus(id: string, status: string, reason: string): OnboardingCase {
    const item = find(id);
    item.Status = status as typeof item.Status;
    item.Exception =
      status === "InProgress"
        ? null
        : {
            Type: (status === "OnHold"
              ? "OnHold"
              : status === "Cancelled"
                ? "Cancelled"
                : "ChangesRequired") as NonNullable<OnboardingCase["Exception"]>["Type"],
            Reason: reason,
            RaisedOn: nowIso(),
            RaisedBy: "current.user",
            Resolvable: status !== "Cancelled",
          };
    touch(item, `StatusChanged:${status}`, reason);
    return { ...item };
  },

  addComment(id: string, text: string): OnboardingCase {
    const item = find(id);
    item.Comments = [
      ...item.Comments,
      { Id: `cmt-${item.Comments.length + 1}`, Author: "Sarah Whitfield", CreatedOn: nowIso(), Text: text },
    ];
    touch(item, "CommentAdded", text);
    return { ...item };
  },

  getKpis(): KpiSummary {
    const all = state();
    const open = all.filter((item) => item.Status !== "Completed" && item.Status !== "Cancelled");
    const overdue = all.filter(
      (item) =>
        item.Tasks.some((task) => task.Status !== "Complete" && task.DueOn && task.DueOn < nowIso()) ||
        item.Exception?.Type === "Overdue",
    );
    return {
      OpenCases: open.length,
      AwaitingMyApproval: all.reduce(
        (sum, item) => sum + item.Approvals.filter((a) => a.Status === "Pending").length,
        0,
      ),
      MyOpenTasks: all.reduce(
        (sum, item) =>
          sum + item.Tasks.filter((t) => t.Status !== "Complete" && t.Status !== "Cancelled").length,
        0,
      ),
      OverdueItems: overdue.length,
      CompletedLast30Days: all.filter((item) => item.Status === "Completed").length,
      AverageCycleTimeDays: 19.4,
      OnTimeCompletionRate: 0.82,
    };
  },

  getStageCounts(): StageCount[] {
    const counts = new Map<string, number>();
    state().forEach((item) => counts.set(item.Stage, (counts.get(item.Stage) ?? 0) + 1));
    return [...counts.entries()].map(([Stage, Count]) => ({ Stage, Count }));
  },

  getReports(): ReportSet {
    return {
      StageAging: [
        { Label: "Validation", Value: 1.2 },
        { Label: "Approvals", Value: 3.4 },
        { Label: "Documents", Value: 2.1 },
        { Label: "Signatures", Value: 4.6 },
        { Label: "Operational Prep", Value: 5.2 },
        { Label: "Final HR Review", Value: 1.1 },
      ],
      ApprovalTurnaround: [
        { Label: "Hiring manager", Value: 14 },
        { Label: "Department head", Value: 26 },
        { Label: "Finance", Value: 31 },
        { Label: "Legal", Value: 52 },
      ],
      TaskCompletionByTeam: [
        { Label: "IT", Value: 92 },
        { Label: "Payroll", Value: 78 },
        { Label: "Facilities", Value: 85 },
        { Label: "HR", Value: 96 },
      ],
      CycleTimeByDepartment: [
        { Label: "Engineering", Value: 18 },
        { Label: "Finance", Value: 22 },
        { Label: "Sales", Value: 15 },
        { Label: "Operations", Value: 20 },
        { Label: "People & Culture", Value: 12 },
      ],
      SlaBreaches: [
        { Label: "Approvals", Value: 3 },
        { Label: "Documents", Value: 1 },
        { Label: "Signatures", Value: 2 },
        { Label: "Tasks", Value: 4 },
      ],
    };
  },
};
