import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  kpiQueryOptions,
  reportsQueryOptions,
  stageCountsQueryOptions,
} from "@/api/stores/OnboardingCaseStore";
import type { ReportRow } from "@/api/types/Reports";
import { PageHeader } from "@/components/app/AppShell";
import { CardsSkeleton, ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Onboarding reports | Employee Onboarding" },
      {
        name: "description",
        content:
          "Cycle time, stage aging, approval turnaround, task completion by team and SLA breaches for employee onboarding.",
      },
      { property: "og:title", content: "Onboarding reports | Employee Onboarding" },
      {
        property: "og:description",
        content: "Operational reporting on onboarding throughput, SLA performance and bottlenecks.",
      },
    ],
  }),
  component: ReportsPage,
});

function BarList({ rows, unit }: { rows: ReportRow[]; unit?: string | undefined }) {
  const max = Math.max(1, ...rows.map((row) => row.Value));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.Label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-foreground">{row.Label}</span>
            <span className="tabular text-sm font-medium text-muted-foreground">
              {row.Value}
              {unit ? ` ${unit}` : ""}
              {row.Secondary != null ? ` / ${row.Secondary}` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.round((row.Value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReportCard({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: ReportRow[];
  unit?: string | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for this period.</p>
        ) : (
          <BarList rows={rows} unit={unit} />
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
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

function ReportsPage() {
  const kpis = useQuery(kpiQueryOptions);
  const stages = useQuery(stageCountsQueryOptions);
  const reports = useQuery(reportsQueryOptions);

  return (
    <>
      <PageHeader
        title="Onboarding reports"
        description="Throughput, SLA performance and bottlenecks. All figures are calculated by Decisions."
      />

      {kpis.isPending ? (
        <CardsSkeleton />
      ) : kpis.isError ? (
        <ErrorState description="Report metrics could not be loaded." onRetry={() => void kpis.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Completed (30 days)" value={String(kpis.data.CompletedLast30Days)} />
          <Metric
            label="Average cycle time"
            value={`${kpis.data.AverageCycleTimeDays} days`}
            hint="Submission to completion"
          />
          <Metric
            label="On-time completion"
            value={`${Math.round(kpis.data.OnTimeCompletionRate * 100)}%`}
            hint="Completed before start date"
          />
          <Metric label="Overdue items" value={String(kpis.data.OverdueItems)} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cases by stage</CardTitle>
          </CardHeader>
          <CardContent>
            {stages.isPending ? (
              <TableSkeleton rows={4} columns={2} />
            ) : stages.isError ? (
              <ErrorState
                description="Stage counts could not be loaded."
                onRetry={() => void stages.refetch()}
              />
            ) : (
              <BarList
                rows={(stages.data ?? []).map((row) => ({ Label: row.Stage, Value: row.Count }))}
              />
            )}
          </CardContent>
        </Card>

        {reports.isPending ? (
          <TableSkeleton rows={5} columns={2} />
        ) : reports.isError ? (
          <ErrorState description="Reports could not be loaded." onRetry={() => void reports.refetch()} />
        ) : (
          <>
            <ReportCard title="Stage aging" rows={reports.data.StageAging} unit="days" />
            <ReportCard
              title="Approval turnaround"
              rows={reports.data.ApprovalTurnaround}
              unit="hours"
            />
            <ReportCard title="Task completion by team" rows={reports.data.TaskCompletionByTeam} unit="%" />
            <ReportCard
              title="Cycle time by department"
              rows={reports.data.CycleTimeByDepartment}
              unit="days"
            />
            <ReportCard title="SLA breaches" rows={reports.data.SlaBreaches} />
          </>
        )}
      </div>
    </>
  );
}
