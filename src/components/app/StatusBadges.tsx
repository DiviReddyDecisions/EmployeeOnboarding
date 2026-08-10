import { cn } from "@/lib/utils";
import type {
  ApprovalStatus,
  CaseStage,
  CaseStatus,
  CheckStatus,
  DocumentStatus,
  SignatureStatus,
  TaskStatus,
} from "@/api/types/Common";
import { STAGE_LABELS, STATUS_LABELS } from "@/api/types/Common";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  info: "bg-info/10 text-info border-info/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}

const caseStatusTone: Record<CaseStatus, Tone> = {
  Draft: "muted",
  InProgress: "info",
  ChangesRequired: "warning",
  OnHold: "warning",
  Rejected: "danger",
  Cancelled: "muted",
  Failed: "danger",
  Completed: "success",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <StatusPill label={STATUS_LABELS[status]} tone={caseStatusTone[status]} />;
}

export function StageBadge({ stage }: { stage: CaseStage }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 text-xs font-medium text-surface-foreground">
      {STAGE_LABELS[stage]}
    </span>
  );
}

const approvalTone: Record<ApprovalStatus, Tone> = {
  Pending: "info",
  Approved: "success",
  ChangesRequested: "warning",
  Rejected: "danger",
  Skipped: "muted",
};

const documentTone: Record<DocumentStatus, Tone> = {
  NotStarted: "muted",
  Generating: "info",
  AwaitingUpload: "warning",
  InReview: "info",
  Complete: "success",
  Rejected: "danger",
};

const signatureTone: Record<SignatureStatus, Tone> = {
  NotSent: "muted",
  Sent: "info",
  Viewed: "info",
  Signed: "success",
  Declined: "danger",
  Expired: "danger",
};

const taskTone: Record<TaskStatus, Tone> = {
  NotStarted: "muted",
  InProgress: "info",
  Blocked: "danger",
  Complete: "success",
  Cancelled: "muted",
};

const checkTone: Record<CheckStatus, Tone> = {
  NotStarted: "muted",
  InProgress: "info",
  Passed: "success",
  Failed: "danger",
  Waived: "warning",
};

const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

export const ApprovalBadge = ({ status }: { status: ApprovalStatus }) => (
  <StatusPill label={humanize(status)} tone={approvalTone[status]} />
);
export const DocumentBadge = ({ status }: { status: DocumentStatus }) => (
  <StatusPill label={humanize(status)} tone={documentTone[status]} />
);
export const SignatureBadge = ({ status }: { status: SignatureStatus }) => (
  <StatusPill label={humanize(status)} tone={signatureTone[status]} />
);
export const TaskBadge = ({ status }: { status: TaskStatus }) => (
  <StatusPill label={humanize(status)} tone={taskTone[status]} />
);
export const CheckBadge = ({ status }: { status: CheckStatus }) => (
  <StatusPill label={humanize(status)} tone={checkTone[status]} />
);
