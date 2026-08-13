import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { plansQuery, studentsQuery } from "@/lib/queries";
import {
  PLAN_STATUS_LABEL,
  formatDate,
  mondayOf,
  todayISO,
  type PlanStatus,
} from "@/lib/rst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento semanal — RST" },
      { name: "description", content: "Organize as sessões previstas da semana por aluno e acompanhe o que já foi realizado." },
      { property: "og:title", content: "Planejamento semanal — RST" },
      { property: "og:description", content: "Sessões previstas da semana, por aluno, com foco e status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planning,
});

function Planning() {
  const queryClient = useQueryClient();
  const students = useQuery(studentsQuery);
  const plans = useQuery(plansQuery);

  const [weekStart, setWeekStart] = useState(mondayOf(todayISO()));
  const [studentId, setStudentId] = useState("");
  const [weekNumber, setWeekNumber] = useState("1");
  const [plannedDate, setPlannedDate] = useState(todayISO());
  const [plannedWorkout, setPlannedWorkout] = useState("");
  const [focus, setFocus] = useState("");

  const weekPlans = (plans.data ?? []).filter((p) => p.week_start === weekStart);
  const nameOf = (id: string) =>
    (students.data ?? []).find((s) => s.id === id)?.full_name ?? "Aluno";

  const create = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("Selecione o aluno.");
      const { error } = await supabase.from("weekly_plans").insert({
        student_id: studentId,
        week_start: weekStart,
        week_number: Number(weekNumber),
        planned_date: plannedDate,
        planned_workout: plannedWorkout || null,
        focus: focus || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Sessão planejada.");
      setPlannedWorkout("");
      setFocus("");
      void queryClient.invalidateQueries({ queryKey: ["weekly_plans"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlanStatus }) => {
      const { error } = await supabase.from("weekly_plans").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["weekly_plans"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_plans").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Planejamento removido.");
      void queryClient.invalidateQueries({ queryKey: ["weekly_plans"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Semana de trabalho"
        title="Planejamento"
        description="Defina as sessões previstas antes de registrar os atendimentos."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="rst-surface h-fit space-y-4 p-5"
        >
          <h2 className="text-lg font-bold">Nova sessão prevista</h2>
          <div className="space-y-1.5">
            <Label htmlFor="semana-inicio">Semana (segunda-feira)</Label>
            <Input
              id="semana-inicio"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(mondayOf(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-aluno">Aluno</Label>
            <select
              id="plan-aluno"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {(students.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.public_code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-numero">Sessão da semana</Label>
              <Input
                id="plan-numero"
                type="number"
                min={1}
                max={5}
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-data">Data prevista</Label>
              <Input
                id="plan-data"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-treino">Treino previsto</Label>
            <Input
              id="plan-treino"
              value={plannedWorkout}
              onChange={(e) => setPlannedWorkout(e.target.value)}
              placeholder="Ex.: Treino A — inferiores"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-foco">Foco</Label>
            <Input
              id="plan-foco"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex.: técnica de agachamento"
            />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Adicionar ao planejamento"}
          </Button>
        </form>

        <section className="rst-surface p-5">
          <h2 className="text-lg font-bold">
            Semana de {formatDate(weekStart)} · {weekPlans.length} sessões
          </h2>
          {plans.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
          ) : weekPlans.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma sessão prevista para esta semana.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {weekPlans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{nameOf(plan.student_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      Sessão {plan.week_number} · {formatDate(plan.planned_date)} ·{" "}
                      {plan.planned_workout ?? "Treino"}
                      {plan.focus ? ` · foco: ${plan.focus}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Status do planejamento"
                      className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                      value={plan.status}
                      onChange={(e) =>
                        updateStatus.mutate({ id: plan.id, status: e.target.value as PlanStatus })
                      }
                    >
                      {(Object.keys(PLAN_STATUS_LABEL) as PlanStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {PLAN_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/nova-sessao" search={{ aluno: plan.student_id, plano: plan.id }}>
                        Registrar
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(plan.id)}>
                      Remover
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
