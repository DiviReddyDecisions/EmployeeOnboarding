import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { casesQueryOptions, kpiQueryOptions } from "@/api/stores/OnboardingCaseStore";
import { PageHeader } from "@/components/app/AppShell";
import { CardsSkeleton, ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { CaseStatusBadge, StageBadge } from "@/components/app/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeName, formatDate, hasOverdueWork, isOpen } from "@/lib/case-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Onboarding dashboard | Employee Onboarding" },
      {
        name: "description",
        content:
          "Track employee onboarding cases, approvals, documents, signatures and operational tasks in one Decisions-backed workspace.",
      },
      { property: "og:title", content: "Onboarding dashboard | Employee Onboarding" },
      {
        property: "og:description",
        content: "Live view of onboarding cases, approvals and operational readiness.",
      },
    ],
  }),
  component: DashboardPage,
});

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="tabular mt-2 text-2xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const kpis = useQuery(kpiQueryOptions);
  const cases = useQuery(casesQueryOptions);

  const open = (cases.data ?? []).filter(isOpen);
  const attention = open.filter((item) => item.Exception || hasOverdueWork(item));

  return (
    <>
      <PageHeader
        title="Onboarding dashboard"
        description="Workload, approvals and operational readiness across all active onboarding cases."
      />

      {kpis.isPending ? (
        <CardsSkeleton />
      ) : kpis.isError ? (
        <ErrorState description="The dashboard metrics could not be loaded." onRetry={() => void kpis.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Open cases" value={String(kpis.data.OpenCases)} />
          <Kpi label="Awaiting approval" value={String(kpis.data.AwaitingMyApproval)} />
          <Kpi label="Open tasks" value={String(kpis.data.MyOpenTasks)} />
          <Kpi
            label="Needs attention"
            value={String(kpis.data.OverdueItems)}
            hint="Overdue or blocked work"
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Active cases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cases.isPending ? (
              <TableSkeleton />
            ) : cases.isError ? (
              <ErrorState description="Onboarding cases could not be loaded." onRetry={() => void cases.refetch()} />
            ) : (
              <ul className="divide-y divide-border">
                {open.slice(0, 8).map((item) => (
                  <li key={item.Id}>
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: item.Id }}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {employeeName(item)}
                        </span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {item.CaseNumber} · {item.Employment.PositionTitle} · starts{" "}
                          {formatDate(item.Employment.StartDate)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <StageBadge stage={item.Stage} />
                        <CaseStatusBadge status={item.Status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attention.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Nothing is blocked or overdue.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((item) => (
                  <li key={item.Id} className="px-6 py-3">
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: item.Id }}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {item.CaseNumber} — {employeeName(item)}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.Exception?.Reason ?? "Overdue work outstanding."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
