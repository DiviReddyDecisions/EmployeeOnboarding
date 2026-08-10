export interface KpiSummary {
  OpenCases: number;
  AwaitingMyApproval: number;
  MyOpenTasks: number;
  OverdueItems: number;
  CompletedLast30Days: number;
  AverageCycleTimeDays: number;
  OnTimeCompletionRate: number;
}

export interface StageCount {
  Stage: string;
  Count: number;
}

export interface ReportRow {
  Label: string;
  Value: number;
  Secondary?: number;
}

export interface ReportSet {
  StageAging: ReportRow[];
  ApprovalTurnaround: ReportRow[];
  TaskCompletionByTeam: ReportRow[];
  CycleTimeByDepartment: ReportRow[];
  SlaBreaches: ReportRow[];
}
