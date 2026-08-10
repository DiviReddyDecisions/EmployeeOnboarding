/** Reference data owned by Decisions (read-only in the front end). */

export interface Department {
  Id: string;
  Name: string;
}

export interface Position {
  Id: string;
  Title: string;
  DepartmentId: string;
  RequiresBackgroundCheck: boolean;
}

export interface LocationRecord {
  Id: string;
  Name: string;
  Country: string;
}

export interface Manager {
  Id: string;
  Name: string;
  DepartmentId: string;
}

export interface DocumentTypeRef {
  Code: string;
  Name: string;
  Source: "Generated" | "Supplied";
  RequiresSignature: boolean;
}

export interface TaskTemplateRef {
  Code: string;
  Name: string;
  Team: string;
  DefaultDueOffsetDays: number;
}

export interface ApprovalMatrixRow {
  Condition: string;
  ApproverRole: string;
  Sequence: number;
  SlaHours: number;
}

export interface ReferenceData {
  Departments: Department[];
  Positions: Position[];
  Locations: LocationRecord[];
  Managers: Manager[];
  DocumentTypes: DocumentTypeRef[];
  TaskTemplates: TaskTemplateRef[];
  ApprovalMatrix: ApprovalMatrixRow[];
}
