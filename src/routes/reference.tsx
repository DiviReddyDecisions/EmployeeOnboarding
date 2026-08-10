import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { referenceDataQueryOptions } from "@/api/stores/OnboardingCaseStore";
import { PageHeader } from "@/components/app/AppShell";
import { ErrorState, TableSkeleton } from "@/components/app/DataStates";
import { StatusPill } from "@/components/app/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Reference data | Employee Onboarding" },
      {
        name: "description",
        content:
          "Departments, positions, locations, managers, document types, task templates and the approval matrix used by onboarding.",
      },
      { property: "og:title", content: "Reference data | Employee Onboarding" },
      {
        property: "og:description",
        content: "Read-only master data that drives onboarding requirements and approval routing.",
      },
    ],
  }),
  component: ReferencePage,
});

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferencePage() {
  const { data, isPending, isError, refetch } = useQuery(referenceDataQueryOptions);

  if (isPending) return <TableSkeleton columns={4} />;
  if (isError || !data) {
    return <ErrorState description="Reference data could not be loaded." onRetry={() => void refetch()} />;
  }

  const departmentName = (id: string) =>
    data.Departments.find((dept) => dept.Id === id)?.Name ?? id;

  return (
    <>
      <PageHeader
        title="Reference data"
        description="Master data owned by Decisions. Read-only here — changes are made in the Decisions environment."
      />

      <Tabs defaultValue="org">
        <TabsList className="flex-wrap">
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Task templates</TabsTrigger>
          <TabsTrigger value="approvals">Approval matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="mt-4 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Departments</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Name"]}
                rows={data.Departments.map((dept) => [dept.Name])}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Title", "Department", "Background check"]}
                rows={data.Positions.map((position) => [
                  position.Title,
                  departmentName(position.DepartmentId),
                  position.RequiresBackgroundCheck ? (
                    <StatusPill label="Required" tone="warning" />
                  ) : (
                    <StatusPill label="Not required" tone="muted" />
                  ),
                ])}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Name", "Country"]}
                rows={data.Locations.map((location) => [location.Name, location.Country])}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Managers</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Name", "Department"]}
                rows={data.Managers.map((manager) => [
                  manager.Name,
                  departmentName(manager.DepartmentId),
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Document types</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Code", "Name", "Source", "Signature"]}
                rows={data.DocumentTypes.map((doc) => [
                  <span className="font-mono text-xs">{doc.Code}</span>,
                  doc.Name,
                  doc.Source,
                  doc.RequiresSignature ? (
                    <StatusPill label="Required" tone="info" />
                  ) : (
                    <StatusPill label="None" tone="muted" />
                  ),
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Code", "Name", "Team", "Due offset (days)"]}
                rows={data.TaskTemplates.map((task) => [
                  <span className="font-mono text-xs">{task.Code}</span>,
                  task.Name,
                  task.Team,
                  <span className="tabular">{task.DefaultDueOffsetDays}</span>,
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approval matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <DataTable
                headers={["Sequence", "Condition", "Approver role", "SLA (hours)"]}
                rows={[...data.ApprovalMatrix]
                  .sort((a, b) => a.Sequence - b.Sequence)
                  .map((row) => [
                    <span className="tabular">{row.Sequence}</span>,
                    row.Condition,
                    row.ApproverRole,
                    <span className="tabular">{row.SlaHours}</span>,
                  ])}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
