/**
 * Shared enumerations and primitives for the EmployeeOnboarding namespace.
 * These mirror the enumerations documented in docs/decisions-contract.json and
 * must be created as Decisions enumerations / value lists on the backend.
 */

export const CASE_STAGES = [
  "Draft",
  "Validation",
  "RequirementsDetermination",
  "Approvals",
  "Documents",
  "Signatures",
  "OperationalPreparation",
  "FinalReview",
  "Completed",
] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export const CASE_STATUSES = [
  "Draft",
  "InProgress",
  "ChangesRequired",
  "OnHold",
  "Rejected",
  "Cancelled",
  "Failed",
  "Completed",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export type ApprovalStatus = "Pending" | "Approved" | "ChangesRequested" | "Rejected" | "Skipped";

export type DocumentStatus =
  | "NotStarted"
  | "Generating"
  | "AwaitingUpload"
  | "InReview"
  | "Complete"
  | "Rejected";

export type SignatureStatus = "NotSent" | "Sent" | "Viewed" | "Signed" | "Declined" | "Expired";

export type TaskStatus = "NotStarted" | "InProgress" | "Blocked" | "Complete" | "Cancelled";

export type CheckStatus = "NotStarted" | "InProgress" | "Passed" | "Failed" | "Waived";

export type ExceptionType =
  | "ChangesRequired"
  | "Rejected"
  | "Cancelled"
  | "OnHold"
  | "Overdue"
  | "Failure";

export type EmploymentType = "FullTime" | "PartTime" | "Contract" | "Intern";

export type NotificationChannel = "Email" | "InApp" | "SMS";

export type SlaState = "OnTrack" | "DueSoon" | "Overdue" | "NotApplicable";

export const STAGE_LABELS: Record<CaseStage, string> = {
  Draft: "Draft",
  Validation: "Validation",
  RequirementsDetermination: "Requirements",
  Approvals: "Approvals",
  Documents: "Documents",
  Signatures: "Signatures",
  OperationalPreparation: "Operational Prep",
  FinalReview: "Final HR Review",
  Completed: "Completed",
};

export const STATUS_LABELS: Record<CaseStatus, string> = {
  Draft: "Draft",
  InProgress: "In progress",
  ChangesRequired: "Changes required",
  OnHold: "On hold",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
  Failed: "Failed",
  Completed: "Completed",
};

export interface ValidationIssue {
  Field: string;
  Message: string;
  Severity: "Error" | "Warning";
}

export interface Comment {
  Id: string;
  Author: string;
  CreatedOn: string;
  Text: string;
}
