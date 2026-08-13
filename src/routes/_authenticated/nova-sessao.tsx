import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { plansQuery, sessionsQuery, studentsQuery } from "@/lib/queries";
import {
  ATTENDANCE_LABEL,
  formatDate,
  newExercise,
  todayISO,
  type Attendance,
  type ExerciseDraft,
} from "@/lib/rst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/nova-sessao")({
  validateSearch: (search: Record<string, unknown>) => ({
    aluno: typeof search["aluno"] === "string" ? search["aluno"] : "",
    plano: typeof search["plano"] === "string" ? search["plano"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Nova sessão — RST" },
      { name: "description", content: "Registro completo da sessão em uma única tela, em 1 a 2 minutos." },
      { property: "og:title", content: "Nova sessão — RST" },
      { property: "og:description", content: "Estado, exercícios e fechamento da sessão em uma tela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewSession,
});

function NewSession() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const students = useQuery(studentsQuery);
  const sessions = useQuery(sessionsQuery);
  const plans = useQuery(plansQuery);

  const [studentId, setStudentId] = useState(search.aluno);
  const [planId, setPlanId] = useState(search.plano);
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [weekNumber, setWeekNumber] = useState("1");
  const [workoutType, setWorkoutType] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("presente");
  const [energy, setEnergy] = useState("7");
  const [pain, setPain] = useState("0");
  const [sleep, setSleep] = useState("");
  const [mood, setMood] = useState("");
  const [lateMinutes, setLateMinutes] = useState("0");
  const [duration, setDuration] = useState("60");
  const [initialNotes, setInitialNotes] = useState("");
  const [positives, setPositives] = useState("");
  const [attentionPoints, setAttentionPoints] = useState("");
  const [evolution, setEvolution] = useState("");
  const [nextGoal, setNextGoal] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([newExercise()]);

  const studentList = students.data ?? [];
  const requiresWorkout = attendance === "presente" || attendance === "reposicao";

  const context = useMemo(() => {
    const list = (sessions.data ?? []).filter((s) => s.student_id === studentId);
    return { recent: list.slice(0, 3), nextGoal: list.find((s) => s.next_goal)?.next_goal ?? null };
  }, [sessions.data, studentId]);

  const studentPlans = (plans.data ?? []).filter(
    (p) => p.student_id === studentId && p.status === "planejado",
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("Selecione o aluno.");
      const payload = {
        student_id: studentId,
        plan_id: planId || null,
        session_date: sessionDate,
        week_number: Number(weekNumber),
        workout_type: workoutType,
        attendance,
        energy: energy === "" ? null : energy,
        pain: pain === "" ? null : pain,
        sleep,
        mood,
        late_minutes: lateMinutes === "" ? null : lateMinutes,
        duration_minutes: duration === "" ? null : duration,
        initial_notes: initialNotes,
        positives,
        attention_points: attentionPoints,
        evolution_notes: evolution,
        next_goal: nextGoal,
        exercises: requiresWorkout
          ? exercises
              .filter((ex) => ex.name.trim() !== "")
              .map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps_text: ex.reps_text,
                loads_text: ex.loads_text,
                reference_load: ex.reference_load,
                unit: ex.unit,
                rpe: ex.rpe,
                note: ex.note,
              }))
          : [],
      };
      const { data, error } = await supabase.rpc("save_session", { payload });
      if (error) throw new Error(error.message.replace(/^.*?:\s*/, ""));
      return data as string;
    },
    onSuccess: () => {
      toast.success("Sessão registrada com sucesso.");
      void queryClient.invalidateQueries();
      navigate({ to: "/alunos/$studentId", params: { studentId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function updateExercise(key: string, patch: Partial<ExerciseDraft>) {
    setExercises((list) => list.map((ex) => (ex.key === key ? { ...ex, ...patch } : ex)));
  }
  function move(index: number, delta: number) {
    setExercises((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      const a = next[index]!;
      const b = next[target]!;
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Registro rápido"
        title="Nova sessão"
        description="Estado, exercícios e fechamento em uma única tela."
      />

      <section className="rst-surface mb-6 p-5">
        <h2 className="text-lg font-bold">Contexto do aluno</h2>
        {!studentId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione o aluno abaixo para ver a próxima meta e as 3 últimas sessões.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm">
              <span className="rst-eyebrow">Próxima meta</span>
              <br />
              {context.nextGoal ?? "Nenhuma meta registrada ainda."}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {context.recent.length === 0 ? (
                <li className="text-sm text-muted-foreground">Sem sessões anteriores.</li>
              ) : (
                context.recent.map((s) => (
                  <li key={s.id} className="rounded-md border border-border p-3 text-xs">
                    <p className="font-semibold">{formatDate(s.session_date)}</p>
                    <p className="text-muted-foreground">
                      {ATTENDANCE_LABEL[s.attendance]} · energia {s.energy ?? "—"} · dor {s.pain ?? "—"}
                    </p>
                    <p className="mt-1">{s.workout_type ?? "—"}</p>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-6"
      >
        <section className="rst-surface p-5">
          <h2 className="mb-4 text-lg font-bold">Bloco A — estado e sessão</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="aluno">Aluno</Label>
              <select
                id="aluno"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setPlanId("");
                }}
                required
              >
                <option value="">Selecione</option>
                {studentList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.public_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plano">Planejamento relacionado (opcional)</Label>
              <select
                id="plano"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                <option value="">Sem vínculo</option>
                {studentPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    Sessão {p.week_number} · {formatDate(p.planned_date)} ·{" "}
                    {p.planned_workout ?? "Treino"}
                  </option>
                ))}
              </select>
            </div>
            <TextField id="data" label="Data" type="date" value={sessionDate} onChange={setSessionDate} required />
            <TextField
              id="semana"
              label="Número semanal (1 a 5)"
              type="number"
              value={weekNumber}
              onChange={setWeekNumber}
              min={1}
              max={5}
              required
            />
            <TextField id="tipo" label="Tipo de treino" value={workoutType} onChange={setWorkoutType} />
            <div className="space-y-1.5">
              <Label htmlFor="presenca">Presença</Label>
              <select
                id="presenca"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value as Attendance)}
              >
                {(["presente", "reposicao", "falta", "cancelada"] as Attendance[]).map((a) => (
                  <option key={a} value={a}>
                    {ATTENDANCE_LABEL[a]}
                  </option>
                ))}
              </select>
            </div>
            <TextField id="energia" label="Energia (1 a 10)" type="number" min={1} max={10} value={energy} onChange={setEnergy} />
            <TextField id="dor" label="Dor (0 a 10)" type="number" min={0} max={10} value={pain} onChange={setPain} />
            <TextField id="sono" label="Sono" value={sleep} onChange={setSleep} />
            <TextField id="humor" label="Humor" value={mood} onChange={setMood} />
            <TextField id="atraso" label="Atraso (min)" type="number" min={0} value={lateMinutes} onChange={setLateMinutes} />
            <TextField id="duracao" label="Duração (min)" type="number" min={1} value={duration} onChange={setDuration} />
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="consideracoes">Considerações iniciais</Label>
            <Textarea
              id="consideracoes"
              rows={2}
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
            />
          </div>
        </section>

        <section className="rst-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Bloco B — exercícios</h2>
            <Button type="button" variant="secondary" onClick={() => setExercises((l) => [...l, newExercise()])}>
              Adicionar exercício
            </Button>
          </div>
          {!requiresWorkout ? (
            <p className="text-sm text-muted-foreground">
              Falta e sessão cancelada não exigem exercícios.
            </p>
          ) : (
            <ul className="space-y-4">
              {exercises.map((ex, index) => (
                <li key={ex.key} className="rounded-md border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="rst-eyebrow">Exercício {index + 1}</p>
                    <div className="flex gap-1">
                      <IconButton label="Mover para cima" onClick={() => move(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Mover para baixo" onClick={() => move(index, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Duplicar exercício"
                        onClick={() =>
                          setExercises((l) => [
                            ...l.slice(0, index + 1),
                            { ...ex, key: Math.random().toString(36).slice(2) },
                            ...l.slice(index + 1),
                          ])
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Remover exercício"
                        onClick={() => setExercises((l) => (l.length > 1 ? l.filter((i) => i.key !== ex.key) : l))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <TextField
                      id={`nome-${ex.key}`}
                      label="Nome"
                      value={ex.name}
                      onChange={(v) => updateExercise(ex.key, { name: v })}
                    />
                    <TextField
                      id={`series-${ex.key}`}
                      label="Séries"
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={(v) => updateExercise(ex.key, { sets: v })}
                    />
                    <TextField
                      id={`reps-${ex.key}`}
                      label="Repetições (ex.: 8-12, 10/8, falha)"
                      value={ex.reps_text}
                      onChange={(v) => updateExercise(ex.key, { reps_text: v })}
                    />
                    <TextField
                      id={`cargas-${ex.key}`}
                      label="Cargas por série (ex.: 30-50-70)"
                      value={ex.loads_text}
                      onChange={(v) => updateExercise(ex.key, { loads_text: v })}
                    />
                    <TextField
                      id={`ref-${ex.key}`}
                      label="Carga de referência"
                      type="number"
                      value={ex.reference_load}
                      onChange={(v) => updateExercise(ex.key, { reference_load: v })}
                    />
                    <TextField
                      id={`un-${ex.key}`}
                      label="Unidade"
                      value={ex.unit}
                      onChange={(v) => updateExercise(ex.key, { unit: v })}
                    />
                    <TextField
                      id={`rpe-${ex.key}`}
                      label="RPE (0 a 10)"
                      type="number"
                      min={0}
                      max={10}
                      value={ex.rpe}
                      onChange={(v) => updateExercise(ex.key, { rpe: v })}
                    />
                    <TextField
                      id={`obs-${ex.key}`}
                      label="Observação"
                      value={ex.note}
                      onChange={(v) => updateExercise(ex.key, { note: v })}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rst-surface p-5">
          <h2 className="mb-4 text-lg font-bold">Bloco C — fechamento</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AreaField id="positivos" label="Pontos positivos" value={positives} onChange={setPositives} />
            <AreaField
              id="atencao"
              label="Pontos de atenção"
              value={attentionPoints}
              onChange={setAttentionPoints}
            />
            <AreaField
              id="evolucao"
              label="Evolução percebida / observação final"
              value={evolution}
              onChange={setEvolution}
            />
            <AreaField
              id="meta"
              label="Próxima meta (reaparece no próximo atendimento)"
              value={nextGoal}
              onChange={setNextGoal}
            />
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar sessão"}
          </Button>
          <p className="self-center text-xs text-muted-foreground">
            Presente e reposição exigem tipo de treino, duração e pelo menos um exercício.
          </p>
        </div>
      </form>
    </>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
