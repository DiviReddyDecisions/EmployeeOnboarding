import { queryOptions } from "@tanstack/react-query";

import { GetCurrentUserAccount } from "./apiclient";
import type { CurrentUser } from "./types/Account";

/**
 * Current Decisions account. Roles come from the backend — the front end never
 * infers or stores them.
 */
export const currentUserQueryOptions = queryOptions<CurrentUser>({
  queryKey: ["decisions", "currentUser"],
  queryFn: () => GetCurrentUserAccount(),
  staleTime: 5 * 60 * 1000,
});
