import { queryOptions } from "@tanstack/react-query";

import {
  GetDashboardKpis,
  GetReferenceData,
  GetReports,
  GetStageCounts,
  OnboardingCaseGetAll,
  OnboardingCaseGetById,
} from "../apiclient";

/**
 * Case Data Service store for EmployeeOnboarding.OnboardingCase.
 * Reads only — every write goes through an explicit Decisions action endpoint.
 */

export const onboardingCaseKeys = {
  all: ["onboardingCases"] as const,
  list: () => [...onboardingCaseKeys.all, "list"] as const,
  detail: (id: string) => [...onboardingCaseKeys.all, "detail", id] as const,
};

export const casesQueryOptions = queryOptions({
  queryKey: onboardingCaseKeys.list(),
  queryFn: () => OnboardingCaseGetAll(),
});

export const caseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: onboardingCaseKeys.detail(id),
    queryFn: () => OnboardingCaseGetById(id),
  });

export const referenceDataQueryOptions = queryOptions({
  queryKey: ["referenceData"],
  queryFn: () => GetReferenceData(),
  staleTime: 10 * 60 * 1000,
});

export const kpiQueryOptions = queryOptions({
  queryKey: ["dashboard", "kpis"],
  queryFn: () => GetDashboardKpis(),
});

export const stageCountsQueryOptions = queryOptions({
  queryKey: ["dashboard", "stageCounts"],
  queryFn: () => GetStageCounts(),
});

export const reportsQueryOptions = queryOptions({
  queryKey: ["reports"],
  queryFn: () => GetReports(),
});
