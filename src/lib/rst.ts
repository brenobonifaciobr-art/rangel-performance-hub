export type StudentStatus = "ativo" | "pausado" | "inativo";
export type PlanStatus = "planejado" | "realizado" | "falta" | "cancelado" | "remarcado";
export type Attendance = "presente" | "reposicao" | "falta" | "cancelada";

export interface Student {
  id: string;
  public_code: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  start_date: string | null;
  weekly_frequency: number;
  main_goal: string | null;
  restrictions: string | null;
  notes: string | null;
  status: StudentStatus;
}

export interface WeeklyPlan {
  id: string;
  student_id: string;
  week_start: string;
  week_number: number;
  planned_date: string | null;
  planned_workout: string | null;
  focus: string | null;
  status: PlanStatus;
  note: string | null;
}

export interface SessionRow {
  id: string;
  student_id: string;
  session_date: string;
  week_number: number;
  workout_type: string | null;
  attendance: Attendance;
  energy: number | null;
  pain: number | null;
  duration_minutes: number | null;
  next_goal: string | null;
  positives: string | null;
  attention_points: string | null;
  evolution_notes: string | null;
}

export interface ExerciseDraft {
  key: string;
  name: string;
  sets: string;
  reps_text: string;
  loads_text: string;
  reference_load: string;
  unit: string;
  rpe: string;
  note: string;
}

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  inativo: "Inativo",
};

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  planejado: "Planejado",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
  remarcado: "Remarcado",
};

export const ATTENDANCE_LABEL: Record<Attendance, string> = {
  presente: "Presente",
  reposicao: "Reposição",
  falta: "Falta",
  cancelada: "Cancelada",
};

export const REQUIRES_WORKOUT: Attendance[] = ["presente", "reposicao"];

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateISO: string | null): string {
  if (!dateISO) return "—";
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}

export function average(values: Array<number | null | undefined>): string {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return "—";
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1).replace(".", ",");
}

export function newExercise(): ExerciseDraft {
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    sets: "3",
    reps_text: "8-12",
    loads_text: "",
    reference_load: "",
    unit: "kg",
    rpe: "",
    note: "",
  };
}

export function suggestCode(existing: string[]): string {
  const numbers = existing
    .map((code) => Number(code.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `RST-${String(next).padStart(3, "0")}`;
}
