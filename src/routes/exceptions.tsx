import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { casesQueryOptions } from "@/api/stores/OnboardingCaseStore";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { CaseStatusBadge, StageBadge, StatusPill } from "@/components/app/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeName, formatDateTime, hasOverdueWork, isOpen } from "@/lib/case-utils";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions | Employee Onboarding" },
      {
        name: "description",
        content:
          "Blocked, held, rejected and overdue onboarding cases that need intervention before they can continue.",
      },
      { property: "og:title", content: "Exceptions | Employee Onboarding" },
      {
        property: "og:description",
        content: "Every onboarding case that is blocked, on hold, rejected or running late.",
      },
    ],
  }),
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const cases = useQuery(casesQueryOptions);

  const { blocked, overdue } = useMemo(() => {
    const all = cases.data ?? [];
    return {
      blocked: all.filter((item) => item.Exception != null),
      overdue: all.filter((item) => item.Exception == null && isOpen(item) && hasOverdueWork(item)),
    };
  }, [cases.data]);

  if (cases.isPending) return <TableSkeleton columns={4} />;
  if (cases.isError) {
    return (
      <ErrorState description="Exceptions could not be loaded." onRetry={() => void cases.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="Exceptions"
        description="Cases Decisions has flagged as blocked, plus cases with work past its due date."
      />

      {blocked.length === 0 && overdue.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-5" aria-hidden />}
          title="No exceptions"
          description="Nothing is blocked, on hold or overdue across the onboarding portfolio."
        />
      ) : null}

      {blocked.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Blocked cases ({blocked.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {blocked.map((item) => (
                <li key={item.Id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: item.Id }}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {item.CaseNumber} — {employeeName(item)}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.Exception?.Reason} · raised by {item.Exception?.RaisedBy} on{" "}
                      {formatDateTime(item.Exception?.RaisedOn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill
                      label={item.Exception?.Type ?? "Exception"}
                      tone={item.Exception?.Resolvable ? "warning" : "danger"}
                    />
                    <StageBadge stage={item.Stage} />
                    <CaseStatusBadge status={item.Status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {overdue.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue work ({overdue.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {overdue.map((item) => (
                <li key={item.Id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <Link
                    to="/cases/$caseId"
                    params={{ caseId: item.Id }}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {item.CaseNumber} — {employeeName(item)}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StatusPill label="Overdue work" tone="danger" />
                    <StageBadge stage={item.Stage} />
                    <CaseStatusBadge status={item.Status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
