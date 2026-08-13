import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/AppShell";
import { sessionsQuery, studentsQuery } from "@/lib/queries";
import { ATTENDANCE_LABEL, formatDate, type Attendance } from "@/lib/rst";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de sessões — RST" },
      { name: "description", content: "Consulte todas as sessões registradas por aluno, período e tipo de presença." },
      { property: "og:title", content: "Histórico de sessões — RST" },
      { property: "og:description", content: "Todas as sessões registradas, com filtros por aluno e período." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

function History() {
  const students = useQuery(studentsQuery);
  const sessions = useQuery(sessionsQuery);

  const [studentId, setStudentId] = useState("");
  const [attendance, setAttendance] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const nameOf = (id: string) =>
    (students.data ?? []).find((s) => s.id === id)?.full_name ?? "Aluno";

  const rows = (sessions.data ?? []).filter((s) => {
    if (studentId && s.student_id !== studentId) return false;
    if (attendance && s.attendance !== attendance) return false;
    if (from && s.session_date < from) return false;
    if (to && s.session_date > to) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Registro completo"
        title="Histórico"
        description="Todas as sessões registradas nesta conta."
      />

      <div className="rst-surface mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="hist-aluno">Aluno</Label>
          <select
            id="hist-aluno"
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Todos</option>
            {(students.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-presenca">Presença</Label>
          <select
            id="hist-presenca"
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
          >
            <option value="">Todas</option>
            {(Object.keys(ATTENDANCE_LABEL) as Attendance[]).map((a) => (
              <option key={a} value={a}>
                {ATTENDANCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-de">De</Label>
          <Input id="hist-de" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-ate">Até</Label>
          <Input id="hist-ate" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <section className="rst-surface overflow-x-auto p-5">
        <h2 className="mb-4 text-lg font-bold">{rows.length} sessões encontradas</h2>
        {sessions.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão para os filtros escolhidos.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Aluno</th>
                <th className="py-2 pr-3">Treino</th>
                <th className="py-2 pr-3">Presença</th>
                <th className="py-2 pr-3">Energia</th>
                <th className="py-2 pr-3">Dor</th>
                <th className="py-2 pr-3">Duração</th>
                <th className="py-2">Próxima meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{formatDate(s.session_date)}</td>
                  <td className="py-2 pr-3">
                    <Link
                      to="/alunos/$studentId"
                      params={{ studentId: s.student_id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {nameOf(s.student_id)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{s.workout_type ?? "—"}</td>
                  <td className="py-2 pr-3">{ATTENDANCE_LABEL[s.attendance]}</td>
                  <td className="py-2 pr-3">{s.energy ?? "—"}</td>
                  <td className="py-2 pr-3">{s.pain ?? "—"}</td>
                  <td className="py-2 pr-3">{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</td>
                  <td className="py-2">{s.next_goal ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
