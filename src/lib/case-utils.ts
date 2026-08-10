import type { CaseStage, CaseStatus, SlaState } from "@/api/types/Common";
import type { OnboardingCase } from "@/api/types/OnboardingCase";

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(
      amount,
    );
  } catch {
    return `${amount} ${currency}`;
  }
}

export function employeeName(item: OnboardingCase): string {
  return `${item.Employee.FirstName} ${item.Employee.LastName}`;
}

/** Presentation-only SLA hint. The authoritative SLA state is owned by Decisions. */
export function slaState(dueOn?: string | null, done = false): SlaState {
  if (done || !dueOn) return "NotApplicable";
  const diffHours = (Date.parse(dueOn) - Date.now()) / 3_600_000;
  if (diffHours < 0) return "Overdue";
  if (diffHours < 48) return "DueSoon";
  return "OnTrack";
}

export function isOpen(item: OnboardingCase): boolean {
  return item.Status !== "Completed" && item.Status !== "Cancelled" && item.Status !== "Rejected";
}

export function caseProgress(item: OnboardingCase): number {
  const order: CaseStage[] = [
    "Draft",
    "Validation",
    "RequirementsDetermination",
    "Approvals",
    "Documents",
    "Signatures",
    "OperationalPreparation",
    "FinalReview",
    "Completed",
  ];
  return Math.round((order.indexOf(item.Stage) / (order.length - 1)) * 100);
}

export const EXCEPTION_STATUSES: CaseStatus[] = [
  "ChangesRequired",
  "OnHold",
  "Rejected",
  "Cancelled",
  "Failed",
];

export function hasOverdueWork(item: OnboardingCase): boolean {
  const now = new Date().toISOString();
  return (
    item.Tasks.some((task) => task.Status !== "Complete" && task.DueOn != null && task.DueOn < now) ||
    item.Approvals.some(
      (approval) => approval.Status === "Pending" && approval.DueOn != null && approval.DueOn < now,
    )
  );
}
