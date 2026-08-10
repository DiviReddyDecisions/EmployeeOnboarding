import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  Database,
  LayoutDashboard,
  ListChecks,
  Stamp,
  UserPlus,
} from "lucide-react";

import { useBackendStatus } from "@/api/backendStatus";
import { decisionsConfig } from "@/api/config";
import { currentUserQueryOptions } from "@/api/userInfoStore";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/cases", label: "Onboarding cases", icon: ListChecks, exact: false },
  { to: "/approvals", label: "My approvals", icon: Stamp, exact: false },
  { to: "/tasks", label: "My tasks", icon: CheckSquare, exact: false },
  { to: "/exceptions", label: "Exceptions", icon: AlertTriangle, exact: false },
  { to: "/reports", label: "Reports", icon: BarChart3, exact: false },
  { to: "/reference", label: "Reference data", icon: Database, exact: false },
] as const;

function BackendBanner() {
  const { status, error } = useBackendStatus();
  if (status !== "unreachable" && status !== "mock") return null;
  const isMock = status === "mock";
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-2 text-xs text-warning-foreground"
    >
      <AlertTriangle className="size-4" aria-hidden />
      <span className="font-semibold">
        {isMock ? "Mock mode" : "Decisions backend unreachable"}
      </span>
      <span className="text-warning-foreground/80">
        {isMock
          ? "Showing the local reference data set. Set VITE_DEC_MODE=real to use Decisions."
          : `Showing the local reference data set until the EmployeeOnboarding endpoints exist in Decisions. ${error ?? ""}`}
      </span>
    </div>
  );
}

function UserChip() {
  const { data, isPending } = useQuery(currentUserQueryOptions);
  if (isPending) return <div className="h-8 w-32 animate-pulse rounded bg-sidebar-accent" />;
  const initials = (data?.DisplayName ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-2 py-1.5">
      <span className="grid size-7 place-items-center rounded bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-sidebar-accent-foreground">
          {data?.DisplayName}
        </span>
        <span className="block truncate text-[11px] text-sidebar-foreground/70">
          {data?.Roles.join(" · ")}
        </span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-4 bg-sidebar p-3 md:flex">
        <div className="px-2 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
            Decisions
          </p>
          <p className="text-sm font-semibold text-sidebar-accent-foreground">
            {decisionsConfig.appName}
          </p>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/cases/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-md bg-sidebar-primary px-2.5 py-2 text-sm font-medium text-sidebar-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="size-4" aria-hidden />
            New onboarding
          </Link>
        </nav>
        <UserChip />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <BackendBanner />
        <nav
          aria-label="Primary mobile"
          className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium text-muted-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
