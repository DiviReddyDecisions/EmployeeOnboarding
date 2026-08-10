import type {
  ApprovalStatus,
  CaseStage,
  CaseStatus,
  CheckStatus,
  Comment,
  DocumentStatus,
  EmploymentType,
  ExceptionType,
  NotificationChannel,
  SignatureStatus,
  TaskStatus,
  ValidationIssue,
} from "./Common";

/** Case Structure: EmployeeOnboarding.OnboardingCase */
export interface OnboardingCase {
  Id: string;
  CaseNumber: string;
  Stage: CaseStage;
  Status: CaseStatus;
  Employee: EmployeeInfo;
  Employment: EmploymentInfo;
  Compensation?: CompensationInfo | null;
  RequirementsPlan?: RequirementsPlan | null;
  ValidationIssues: ValidationIssue[];
  Approvals: ApprovalItem[];
  Documents: DocumentRequirement[];
  Signatures: SignatureRequest[];
  Tasks: OperationalTask[];
  Checks: ComplianceCheck[];
  Notifications: NotificationRecord[];
  AuditEvents: AuditEvent[];
  Comments: Comment[];
  Exception?: CaseException | null;
  OwnerName: string;
  CreatedOn: string;
  UpdatedOn: string;
  SubmittedOn?: string | null;
  CompletedOn?: string | null;
  DueOn?: string | null;
}

/** Case Structure extension: EmployeeOnboarding.EmployeeInfo */
export interface EmployeeInfo {
  FirstName: string;
  LastName: string;
  PreferredName?: string;
  PersonalEmail: string;
  Phone?: string;
  Country: string;
  ExistingRecordId?: string | null;
}

/** Case Structure extension: EmployeeOnboarding.EmploymentInfo */
export interface EmploymentInfo {
  PositionId: string;
  PositionTitle: string;
  DepartmentId: string;
  DepartmentName: string;
  ManagerId: string;
  ManagerName: string;
  LocationId: string;
  LocationName: string;
  EmploymentType: EmploymentType;
  StartDate: string;
}

/** Case Structure extension: EmployeeOnboarding.CompensationInfo */
export interface CompensationInfo {
  BaseSalary: number;
  Currency: string;
  PayFrequency: "Monthly" | "BiWeekly" | "Weekly" | "Hourly";
  BonusEligible: boolean;
  BonusPercent?: number | null;
}

/** Produced by the Decisions flow EmployeeOnboarding/DetermineRequirements */
export interface RequirementsPlan {
  DeterminedOn: string;
  RequiredApprovalRoles: string[];
  RequiredDocumentTypes: string[];
  RequiredSignatureDocumentTypes: string[];
  RequiredCheckTypes: string[];
  RequiredTaskTypes: string[];
  Rationale: string[];
}

export interface ApprovalItem {
  Id: string;
  Sequence: number;
  ApproverRole: string;
  ApproverName: string;
  Status: ApprovalStatus;
  DueOn?: string | null;
  DecidedOn?: string | null;
  Comments?: string | null;
}

export interface DocumentRequirement {
  Id: string;
  DocumentType: string;
  Name: string;
  Required: boolean;
  Source: "Generated" | "Supplied";
  Status: DocumentStatus;
  FileName?: string | null;
  UploadedBy?: string | null;
  UpdatedOn?: string | null;
  ReviewNotes?: string | null;
}

export interface SignatureRequest {
  Id: string;
  DocumentId: string;
  DocumentName: string;
  SignerName: string;
  SignerEmail: string;
  Status: SignatureStatus;
  SentOn?: string | null;
  CompletedOn?: string | null;
  DeclineReason?: string | null;
}

export interface OperationalTask {
  Id: string;
  TaskType: string;
  Name: string;
  Team: string;
  AssigneeName: string;
  Status: TaskStatus;
  DueOn?: string | null;
  CompletedOn?: string | null;
  BlockedReason?: string | null;
}

export interface ComplianceCheck {
  Id: string;
  CheckType: string;
  Name: string;
  Status: CheckStatus;
  CompletedOn?: string | null;
  Notes?: string | null;
}

export interface NotificationRecord {
  Id: string;
  Template: string;
  Subject: string;
  Recipient: string;
  Channel: NotificationChannel;
  SentOn: string;
  Status: "Sent" | "Failed" | "Queued";
}

export interface AuditEvent {
  Id: string;
  EventType: string;
  Actor: string;
  OccurredOn: string;
  Detail: string;
}

export interface CaseException {
  Type: ExceptionType;
  Reason: string;
  RaisedOn: string;
  RaisedBy: string;
  Resolvable: boolean;
}

/** Request payload for EmployeeOnboarding/Create and /SaveDraft */
export interface OnboardingCaseInput {
  Id?: string | null;
  Employee: EmployeeInfo;
  Employment: EmploymentInfo;
  Compensation?: CompensationInfo | null;
}
