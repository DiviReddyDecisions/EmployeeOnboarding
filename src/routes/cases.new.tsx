import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OnboardingCaseCreate } from "@/api/apiclient";
import { onboardingCaseKeys, referenceDataQueryOptions } from "@/api/stores/OnboardingCaseStore";
import type { OnboardingCaseInput } from "@/api/types/OnboardingCase";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cases/new")({
  head: () => ({
    meta: [
      { title: "New onboarding request | Employee Onboarding" },
      {
        name: "description",
        content:
          "Start an employee onboarding request with employee, employment and compensation information.",
      },
      { property: "og:title", content: "New onboarding request | Employee Onboarding" },
      {
        property: "og:description",
        content: "Capture employee, employment and compensation details and submit for validation.",
      },
    ],
  }),
  component: NewCasePage,
});

function NewCasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reference = useQuery(referenceDataQueryOptions);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    positionId: "",
    departmentId: "",
    managerId: "",
    locationId: "",
    employmentType: "FullTime",
    startDate: "",
    includeCompensation: false,
    baseSalary: "",
    currency: "EUR",
    payFrequency: "Monthly",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: ({ input, submit }: { input: OnboardingCaseInput; submit: boolean }) =>
      OnboardingCaseCreate(input, submit),
    onSuccess: (created, variables) => {
      void queryClient.invalidateQueries({ queryKey: onboardingCaseKeys.all });
      toast.success(variables.submit ? "Onboarding request submitted" : "Draft saved");
      void navigate({ to: "/cases/$caseId", params: { caseId: created.Id } });
    },
    onError: () => toast.error("The request could not be saved. Please try again."),
  });

  // Presentation-level validation only. Decisions performs authoritative validation.
  function validate(submit: boolean): OnboardingCaseInput | null {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next["firstName"] = "First name is required.";
    if (!form.lastName.trim()) next["lastName"] = "Last name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next["email"] = "A valid personal email is required.";
    if (submit) {
      if (!form.positionId) next["positionId"] = "Position is required.";
      if (!form.departmentId) next["departmentId"] = "Department is required.";
      if (!form.managerId) next["managerId"] = "Manager is required.";
      if (!form.locationId) next["locationId"] = "Location is required.";
      if (!form.startDate) next["startDate"] = "Start date is required.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    const data = reference.data;
    const position = data?.Positions.find((item) => item.Id === form.positionId);
    const department = data?.Departments.find((item) => item.Id === form.departmentId);
    const manager = data?.Managers.find((item) => item.Id === form.managerId);
    const location = data?.Locations.find((item) => item.Id === form.locationId);

    return {
      Employee: {
        FirstName: form.firstName.trim(),
        LastName: form.lastName.trim(),
        PersonalEmail: form.email.trim(),
        Phone: form.phone.trim(),
        Country: form.country.trim() || (location?.Country ?? ""),
        ExistingRecordId: null,
      },
      Employment: {
        PositionId: form.positionId,
        PositionTitle: position?.Title ?? "",
        DepartmentId: form.departmentId,
        DepartmentName: department?.Name ?? "",
        ManagerId: form.managerId,
        ManagerName: manager?.Name ?? "",
        LocationId: form.locationId,
        LocationName: location?.Name ?? "",
        EmploymentType: form.employmentType as OnboardingCaseInput["Employment"]["EmploymentType"],
        StartDate: form.startDate ? new Date(form.startDate).toISOString() : "",
      },
      Compensation: form.includeCompensation
        ? {
            BaseSalary: Number(form.baseSalary || 0),
            Currency: form.currency,
            PayFrequency: form.payFrequency as "Monthly" | "BiWeekly" | "Weekly" | "Hourly",
            BonusEligible: false,
            BonusPercent: null,
          }
        : null,
    };
  }

  function handle(submit: boolean) {
    const input = validate(submit);
    if (!input) {
      toast.error("Please correct the highlighted fields.");
      return;
    }
    mutation.mutate({ input, submit });
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-destructive" role="alert">
        {errors[key]}
      </p>
    ) : null;

  return (
    <>
      <PageHeader
        title="New onboarding request"
        description="HR captures the available employee and employment information, then submits for validation."
      />

      <form
        className="grid max-w-4xl gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          handle(true);
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Employee</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              {fieldError("firstName")}
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              {fieldError("lastName")}
            </div>
            <div>
              <Label htmlFor="email">Personal email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {fieldError("email")}
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Employment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={(value) => set("departmentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {(reference.data?.Departments ?? []).map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("departmentId")}
            </div>
            <div>
              <Label>Position</Label>
              <Select value={form.positionId} onValueChange={(value) => set("positionId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {(reference.data?.Positions ?? [])
                    .filter((item) => !form.departmentId || item.DepartmentId === form.departmentId)
                    .map((item) => (
                      <SelectItem key={item.Id} value={item.Id}>
                        {item.Title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {fieldError("positionId")}
            </div>
            <div>
              <Label>Manager</Label>
              <Select value={form.managerId} onValueChange={(value) => set("managerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {(reference.data?.Managers ?? []).map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("managerId")}
            </div>
            <div>
              <Label>Location</Label>
              <Select value={form.locationId} onValueChange={(value) => set("locationId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {(reference.data?.Locations ?? []).map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("locationId")}
            </div>
            <div>
              <Label>Employment type</Label>
              <Select value={form.employmentType} onValueChange={(value) => set("employmentType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FullTime">Full time</SelectItem>
                  <SelectItem value="PartTime">Part time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              {fieldError("startDate")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Compensation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm md:col-span-3">
              <Checkbox
                checked={form.includeCompensation}
                onCheckedChange={(checked) => set("includeCompensation", checked === true)}
              />
              Provide compensation information now
            </label>
            {form.includeCompensation ? (
              <>
                <div>
                  <Label htmlFor="baseSalary">Base salary</Label>
                  <Input
                    id="baseSalary"
                    inputMode="numeric"
                    value={form.baseSalary}
                    onChange={(e) => set("baseSalary", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
                </div>
                <div>
                  <Label>Pay frequency</Label>
                  <Select value={form.payFrequency} onValueChange={(value) => set("payFrequency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="BiWeekly">Bi-weekly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Submit request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => handle(false)}
          >
            Save draft
          </Button>
        </div>
      </form>
    </>
  );
}
