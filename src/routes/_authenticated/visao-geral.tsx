import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { plansQuery, sessionsQuery, studentsQuery } from "@/lib/queries";
import { ATTENDANCE_LABEL, formatDate, mondayOf, todayISO } from "@/lib/rst";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/visao-geral")({
  head: () => ({
    meta: [
      { title: "Visão geral — RST" },
      { name: "description", content: "Painel operacional do dia: alunos ativos, sessões previstas e realizadas." },
      { property: "og:title", content: "Visão geral — RST" },
      { property: "og:description", content: "Painel operacional do dia no Rangel System Training." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "primary" }) {
  return (
    <div className="rst-surface p-4">
      <p className="rst-eyebrow">{label}</p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold ${
          tone === "primary" ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Overview() {
  const queryClient = useQueryClient();
  const students = useQuery(studentsQuery);
  const sessions = useQuery(sessionsQuery);
  const plans = useQuery(plansQuery);

  const seed = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("seed_demo_data");
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: (message) => {
      toast.success(message);
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const today = todayISO();
  const week = mondayOf(today);
  const all = students.data ?? [];
  const activeStudents = all.filter((s) => s.status === "ativo");
  const weekPlans = (plans.data ?? []).filter((p) => p.week_start === week);
  const weekSessions = (sessions.data ?? []).filter((s) => s.session_date >= week);
  const done = weekSessions.filter((s) => s.attendance === "presente" || s.attendance === "reposicao");
  const missed = weekSessions.filter((s) => s.attendance === "falta" || s.attendance === "cancelada");
  const todaySessions = (sessions.data ?? []).filter((s) => s.session_date === today);
  const todayPlans = weekPlans.filter((p) => p.planned_date === today);
  const nameOf = (id: string) => all.find((s) => s.id === id)?.full_name ?? "Aluno";

  const attention = activeStudents
    .map((student) => {
      const list = (sessions.data ?? []).filter((s) => s.student_id === student.id);
      const last = list[0];
      const highPain = last && typeof last.pain === "number" && last.pain >= 5;
      const stale = !last || last.session_date < shiftDays(today, -10);
      const openPlans = weekPlans.filter((p) => p.student_id === student.id && p.status === "planejado").length;
      const reasons: string[] = [];
      if (stale) reasons.push("sem sessão há mais de 10 dias");
      if (highPain) reasons.push(`dor ${last?.pain} na última sessão`);
      if (openPlans === 0 && weekPlans.length > 0) reasons.push("sem planejamento nesta semana");
      return { student, reasons };
    })
    .filter((item) => item.reasons.length > 0);

  const loading = students.isLoading || sessions.isLoading || plans.isLoading;

  return (
    <>
      <PageHeader
        eyebrow="Treinar, registrar. Evoluir."
        title="Visão geral"
        description="Prioridade do dia e estado operacional da semana."
        action={
          <Button asChild>
            <Link to="/nova-sessao" search={{ aluno: "", plano: "" }}>
              Registrar sessão
            </Link>
          </Button>
        }
      />

      {loading ? <p className="text-sm text-muted-foreground">Carregando dados...</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Alunos ativos" value={activeStudents.length} tone="primary" />
        <Stat label="Previstas na semana" value={weekPlans.length} />
        <Stat label="Realizadas" value={done.length} />
        <Stat label="Faltas / cancelam." value={missed.length} />
        <Stat label="Atendimentos hoje" value={todaySessions.length} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rst-surface p-5">
          <h2 className="text-lg font-bold">Próxima ação</h2>
          {todayPlans.length === 0 && todaySessions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum atendimento previsto para hoje. Registre uma sessão ou planeje a semana.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todayPlans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{nameOf(plan.student_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.planned_workout ?? "Treino"} · sessão {plan.week_number}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/nova-sessao" search={{ aluno: plan.student_id, plano: plan.id }}>
                      Registrar
                    </Link>
                  </Button>
                </li>
              ))}
              {todaySessions.map((session) => (
                <li key={session.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-semibold">{nameOf(session.student_id)}</span>{" "}
                  <span className="text-muted-foreground">
                    · {ATTENDANCE_LABEL[session.attendance]} · {formatDate(session.session_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rst-surface p-5">
          <h2 className="text-lg font-bold">Pontos de atenção</h2>
          {attention.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhum ponto de atenção no momento.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {attention.slice(0, 6).map(({ student, reasons }) => (
                <li key={student.id} className="rounded-md border border-border px-3 py-2">
                  <Link
                    to="/alunos/$studentId"
                    params={{ studentId: student.id }}
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {student.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{reasons.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {all.length === 0 && !loading ? (
        <section className="mt-8 rst-surface p-5">
          <h2 className="text-lg font-bold">Comece pelos dados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre seu primeiro aluno ou carregue alunos fictícios para conhecer o fluxo. Os dados
            demonstrativos ficam apenas na sua conta.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/alunos">Cadastrar aluno</Link>
            </Button>
            <Button variant="secondary" onClick={() => seed.mutate()} disabled={seed.isPending}>
              {seed.isPending ? "Carregando..." : "Carregar dados demonstrativos"}
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}

function shiftDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
