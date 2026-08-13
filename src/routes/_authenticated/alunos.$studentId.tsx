import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/AppShell";
import { sessionsQuery, studentsQuery } from "@/lib/queries";
import {
  ATTENDANCE_LABEL,
  STUDENT_STATUS_LABEL,
  average,
  formatDate,
} from "@/lib/rst";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/alunos/$studentId")({
  head: () => ({
    meta: [
      { title: "Painel do aluno — RST" },
      { name: "description", content: "Objetivo, frequência, próxima meta e as 3 sessões mais recentes do aluno." },
      { property: "og:title", content: "Painel do aluno — RST" },
      { property: "og:description", content: "Contexto rápido do aluno antes do próximo atendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentPanel,
});

function StudentPanel() {
  const { studentId } = Route.useParams();
  const students = useQuery(studentsQuery);
  const sessions = useQuery(sessionsQuery);

  const student = (students.data ?? []).find((s) => s.id === studentId);
  const list = (sessions.data ?? []).filter((s) => s.student_id === studentId);
  const recent = list.slice(0, 3);
  const nextGoal = list.find((s) => s.next_goal)?.next_goal ?? null;

  if (students.isLoading) return <p className="text-sm text-muted-foreground">Carregando aluno...</p>;
  if (!student) return <p className="text-sm text-muted-foreground">Aluno não encontrado nesta conta.</p>;

  return (
    <>
      <PageHeader
        eyebrow={`${student.public_code} · ${STUDENT_STATUS_LABEL[student.status]}`}
        title={student.full_name}
        description={student.main_goal ?? "Objetivo não informado"}
        action={
          <Button asChild>
            <Link to="/nova-sessao" search={{ aluno: student.id, plano: "" }}>
              Nova sessão
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Frequência" value={`${student.weekly_frequency}x / semana`} />
        <Metric label="Total de sessões" value={String(list.length)} />
        <Metric label="Energia média" value={average(list.map((s) => s.energy))} />
        <Metric label="Dor média" value={average(list.map((s) => s.pain))} />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rst-surface p-5">
          <h2 className="text-lg font-bold">Próxima meta</h2>
          <p className="mt-2 text-sm">
            {nextGoal ?? "Nenhuma meta registrada ainda. Defina uma no fechamento da próxima sessão."}
          </p>
          <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline font-semibold text-foreground">Início: </dt>
              <dd className="inline">{formatDate(student.start_date)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-foreground">Telefone: </dt>
              <dd className="inline">{student.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-foreground">Restrições: </dt>
              <dd className="inline">{student.restrictions ?? "Nenhuma registrada"}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-foreground">Observações: </dt>
              <dd className="inline">{student.notes ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rst-surface p-5">
          <h2 className="text-lg font-bold">3 sessões mais recentes</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma sessão registrada.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recent.map((session) => (
                <li key={session.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold">
                    {formatDate(session.session_date)} · {ATTENDANCE_LABEL[session.attendance]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.workout_type ?? "Sem treino"} · energia {session.energy ?? "—"} · dor{" "}
                    {session.pain ?? "—"} · {session.duration_minutes ?? "—"} min
                  </p>
                  {session.evolution_notes ? (
                    <p className="mt-1 text-sm">{session.evolution_notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rst-surface p-4">
      <p className="rst-eyebrow">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold">{value}</p>
    </div>
  );
}
