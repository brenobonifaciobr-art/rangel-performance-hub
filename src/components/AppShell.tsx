import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Gauge, PlusCircle, Users, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/visao-geral", label: "Visão geral", icon: Gauge },
  { to: "/alunos", label: "Alunos", icon: Users },
  { to: "/planejamento", label: "Planejamento", icon: CalendarDays },
  { to: "/nova-sessao", label: "Nova sessão", icon: PlusCircle },
  { to: "/historico", label: "Histórico", icon: ClipboardList },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-graphite text-graphite-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/visao-geral" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded bg-primary font-[family-name:var(--font-display)] text-sm font-black text-primary-foreground">
              R
            </span>
            <span className="hidden font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight sm:block">
              RST
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Navegação principal">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-graphite-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-graphite-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-graphite-foreground/80 hover:bg-sidebar-accent hover:text-graphite-foreground"
            >
              <LogOut className="mr-1 h-4 w-4" aria-hidden />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pb-12">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden"
        aria-label="Navegação inferior"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                <span className="leading-tight">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="rst-eyebrow">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
