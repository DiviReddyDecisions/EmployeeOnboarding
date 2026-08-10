import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { caseQueryOptions } from "@/api/stores/OnboardingCaseStore";
import { PageHeader } from "@/components/app/AppShell";
import { ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { CaseStatusBadge, StageBadge } from "@/components/app/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employeeName, formatDate } from "@/lib/case-utils";

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case detail | Employee Onboarding" },
      {
        name: "description",
        content:
          "Review an onboarding case: employment details, approvals, documents, signatures, tasks and timeline.",
      },
      { property: "og:title", content: "Case detail | Employee Onboarding" },
      {
        property: "og:description",
        content: "Approvals, documents, signatures, operational tasks and full case history.",
      },
    ],
  }),
  component: CaseDetailPage,
});

function CaseDetailPage() {
  const { caseId } = Route.useParams();
  const { data, isPending, isError, refetch } = useQuery(caseQueryOptions(caseId));

  if (isPending) return <TableSkeleton columns={4} />;
  if (isError || !data) {
    return <ErrorState description="This onboarding case could not be loaded." onRetry={() => void refetch()} />;
  }

  return (
    <>
      <PageHeader
        title={employeeName(data)}
        description={`${data.CaseNumber} · ${data.Employment.PositionTitle} · ${data.Employment.DepartmentName}`}
        actions={
          <span className="flex items-center gap-2">
            <StageBadge stage={data.Stage} />
            <CaseStatusBadge status={data.Status} />
          </span>
        }
      />

      <Link to="/cases" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← Back to cases
      </Link>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Employment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Manager: </span>
                {data.Employment.ManagerName}
              </p>
              <p>
                <span className="text-muted-foreground">Location: </span>
                {data.Employment.LocationName}
              </p>
              <p>
                <span className="text-muted-foreground">Employment type: </span>
                {data.Employment.EmploymentType}
              </p>
              <p>
                <span className="text-muted-foreground">Start date: </span>
                {formatDate(data.Employment.StartDate)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border text-sm">
                {data.Approvals.map((item) => (
                  <li key={item.Id} className="flex items-center justify-between px-4 py-3">
                    <span>
                      <span className="font-medium">{item.ApproverRole}</span>
                      <span className="block text-xs text-muted-foreground">{item.ApproverName}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{item.Status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border text-sm">
                {data.Documents.map((item) => (
                  <li key={item.Id} className="flex items-center justify-between px-4 py-3">
                    <span>{item.Name}</span>
                    <span className="text-xs text-muted-foreground">{item.Status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border text-sm">
                {data.Tasks.map((item) => (
                  <li key={item.Id} className="flex items-center justify-between px-4 py-3">
                    <span>
                      {item.Name}
                      <span className="block text-xs text-muted-foreground">
                        {item.Team} · {item.AssigneeName}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{item.Status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border text-sm">
                {data.AuditEvents.map((item) => (
                  <li key={item.Id} className="px-4 py-3">
                    <span className="font-medium">{item.EventType}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.Actor} · {formatDate(item.OccurredOn)} — {item.Detail}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
