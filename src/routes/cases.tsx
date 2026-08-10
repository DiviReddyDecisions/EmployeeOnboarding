import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { casesQueryOptions } from "@/api/stores/OnboardingCaseStore";
import { CASE_STAGES, CASE_STATUSES, STAGE_LABELS, STATUS_LABELS } from "@/api/types/Common";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { CaseStatusBadge, StageBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employeeName, formatDate } from "@/lib/case-utils";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Onboarding cases | Employee Onboarding" },
      {
        name: "description",
        content: "Search, filter and open every employee onboarding case and its current stage.",
      },
      { property: "og:title", content: "Onboarding cases | Employee Onboarding" },
      { property: "og:description", content: "Every onboarding case with stage, status and owner." },
    ],
  }),
  component: CasesPage,
});

const PAGE_SIZE = 10;

function CasesPage() {
  const { data, isPending, isError, refetch } = useQuery(casesQueryOptions);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchesTerm =
        !term ||
        employeeName(item).toLowerCase().includes(term) ||
        item.CaseNumber.toLowerCase().includes(term) ||
        item.Employment.DepartmentName.toLowerCase().includes(term);
      const matchesStage = stage === "all" || item.Stage === stage;
      const matchesStatus = status === "all" || item.Status === status;
      return matchesTerm && matchesStage && matchesStatus;
    });
  }, [data, search, stage, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Onboarding cases"
        description="Every onboarding request and where it currently sits in the process."
        actions={
          <Button asChild size="sm">
            <Link to="/cases/new">New onboarding request</Link>
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="case-search" className="text-xs">
              Search
            </Label>
            <Input
              id="case-search"
              value={search}
              placeholder="Name, case number or department"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Stage</Label>
            <Select
              value={stage}
              onValueChange={(value) => {
                setStage(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {CASE_STAGES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STAGE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CASE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isPending ? (
          <TableSkeleton columns={6} />
        ) : isError ? (
          <ErrorState description="Onboarding cases could not be loaded." onRetry={() => void refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No matching cases"
            description="Adjust the search or filters, or start a new onboarding request."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Onboarding cases</caption>
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Case</th>
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Start date</th>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((item) => (
                  <tr key={item.Id} className="hover:bg-surface">
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: item.Id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.CaseNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{employeeName(item)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.Employment.DepartmentName}</td>
                    <td className="px-4 py-2 tabular text-muted-foreground">
                      {formatDate(item.Employment.StartDate)}
                    </td>
                    <td className="px-4 py-2">
                      <StageBadge stage={item.Stage} />
                    </td>
                    <td className="px-4 py-2">
                      <CaseStatusBadge status={item.Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {filtered.length > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {current} of {pageCount} · {filtered.length} cases
          </span>
          <span className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </span>
        </div>
      ) : null}
    </>
  );
}
