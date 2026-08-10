/** Shape returned by Decisions AccountService/GetCurrentAccount (subset used here). */
export interface DecisionsAccount {
  EmailAddress: string;
  DisplayName?: string;
  AccountId?: string;
  /** Decisions groups/permissions drive the app roles; never derived client-side. */
  Groups?: string[];
}

export type AppRole =
  | "HRSpecialist"
  | "HRManager"
  | "Approver"
  | "TaskAssignee"
  | "Signer"
  | "Auditor";

export interface CurrentUser {
  Account: DecisionsAccount;
  DisplayName: string;
  Email: string;
  Roles: AppRole[];
}
