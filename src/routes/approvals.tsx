import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stamp } from "lucide-react";

import { OnboardingCaseDecideApproval } from "@/api/apiclient";
import { casesQueryOptions, onboardingCaseKeys } from "@/api/stores/OnboardingCaseStore";
import { currentUserQueryOptions } from "@/api/userInfoStore";
import type { ApprovalItem, OnboardingCase } from "@/api/types/OnboardingCase";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { ApprovalBadge, StatusPill } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { employeeName, formatDateTime, slaState } from "@/lib/case-utils";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "My approvals | Employee Onboarding" },
      {
        name: "description",
        content:
          "Review and decide pending onboarding approvals: approve, request changes or reject with comments.",
      },
      { property: "og:title", content: "My approvals | Employee Onboarding" },
      {
        property: "og:description",
        content: "Pending onboarding approvals assigned to you, with SLA due dates and decisions.",
      },
    ],
  }),
  component: ApprovalsPage,
});

type PendingApproval = { item: OnboardingCase; approval: ApprovalItem };

function SlaPill({ dueOn }: { dueOn?: string | null }) {
  const state = slaState(dueOn);
  if (state === "NotApplicable") return null;
  const tone = state === "Overdue" ? "danger" : state === "DueSoon" ? "warning" : "success";
  const label = state === "Overdue" ? "Overdue" : state === "DueSoon" ? "Due soon" : "On track";
  return <StatusPill label={label} tone={tone} />;
}

function ApprovalRow({ entry }: { entry: PendingApproval }) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");
  const [open, setOpen] = useState(false);

  const decide = useMutation({
    mutationFn: (decision: "Approve" | "RequestChanges" | "Reject") =>
      OnboardingCaseDecideApproval(entry.item.Id, entry.approval.Id, decision, comments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingCaseKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setComments("");
      setOpen(false);
    },
  });

  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/cases/$caseId"
            params={{ caseId: entry.item.Id }}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {entry.item.CaseNumber} — {employeeName(entry.item)}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.approval.ApproverRole} · step {entry.approval.Sequence} ·{" "}
            {entry.item.Employment.PositionTitle} · due {formatDateTime(entry.approval.DueOn)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SlaPill dueOn={entry.approval.DueOn} />
          <ApprovalBadge status={entry.approval.Status} />
          <Button size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
            {open ? "Cancel" : "Decide"}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="mt-3 rounded-md border border-border bg-surface p-3">
          <Label htmlFor={`comments-${entry.approval.Id}`} className="text-xs">
            Comments
          </Label>
          <Textarea
            id={`comments-${entry.approval.Id}`}
            value={comments}
            rows={2}
            placeholder="Optional for approvals, required when requesting changes."
            onChange={(event) => setComments(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate("Approve")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={decide.isPending || comments.trim().length === 0}
              onClick={() => decide.mutate("RequestChanges")}
            >
              Request changes
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={decide.isPending || comments.trim().length === 0}
              onClick={() => decide.mutate("Reject")}
            >
              Reject
            </Button>
          </div>
          {decide.isError ? (
            <p className="mt-2 text-xs text-destructive">
              The decision could not be recorded. Please try again.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ApprovalsPage() {
  const cases = useQuery(casesQueryOptions);
  const user = useQuery(currentUserQueryOptions);
  const [mineOnly, setMineOnly] = useState(true);

  const pending = useMemo<PendingApproval[]>(() => {
    const all: PendingApproval[] = [];
    for (const item of cases.data ?? []) {
      for (const approval of item.Approvals) {
        if (approval.Status === "Pending") all.push({ item, approval });
      }
    }
    return all.sort((a, b) => (a.approval.DueOn ?? "").localeCompare(b.approval.DueOn ?? ""));
  }, [cases.data]);

  const isMine = (entry: PendingApproval) =>
    entry.approval.ApproverName === user.data?.DisplayName ||
    (user.data?.Roles ?? []).includes(entry.approval.ApproverRole);

  const visible = mineOnly ? pending.filter(isMine) : pending;

  return (
    <>
      <PageHeader
        title="My approvals"
        description="Approval steps waiting on a decision. Decisions owns the routing — this is the queue it produced."
        actions={
          <Button size="sm" variant="outline" onClick={() => setMineOnly((value) => !value)}>
            {mineOnly ? "Show all pending approvals" : "Show only mine"}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {cases.isPending ? (
            <TableSkeleton columns={4} />
          ) : cases.isError ? (
            <ErrorState
              description="The approval queue could not be loaded."
              onRetry={() => void cases.refetch()}
            />
          ) : visible.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Stamp className="size-5" aria-hidden />}
                title="No approvals waiting"
                description={
                  mineOnly
                    ? "Nothing is assigned to your roles right now. Switch to all pending approvals to see the wider queue."
                    : "Every approval step across all onboarding cases has been decided."
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((entry) => (
                <ApprovalRow key={`${entry.item.Id}-${entry.approval.Id}`} entry={entry} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
