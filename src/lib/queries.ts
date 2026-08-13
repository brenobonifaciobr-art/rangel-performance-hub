import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { SessionRow, Student, WeeklyPlan } from "./rst";

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: async (): Promise<Student[]> => {
    const { data, error } = await supabase
      .from("students")
      .select(
        "id, public_code, full_name, birth_date, phone, start_date, weekly_frequency, main_goal, restrictions, notes, status",
      )
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Student[];
  },
});

export const sessionsQuery = queryOptions({
  queryKey: ["sessions"],
  queryFn: async (): Promise<SessionRow[]> => {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, student_id, session_date, week_number, workout_type, attendance, energy, pain, duration_minutes, next_goal, positives, attention_points, evolution_notes",
      )
      .order("session_date", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as SessionRow[];
  },
});

export const plansQuery = queryOptions({
  queryKey: ["weekly_plans"],
  queryFn: async (): Promise<WeeklyPlan[]> => {
    const { data, error } = await supabase
      .from("weekly_plans")
      .select(
        "id, student_id, week_start, week_number, planned_date, planned_workout, focus, status, note",
      )
      .order("week_start", { ascending: false })
      .order("week_number");
    if (error) throw new Error(error.message);
    return (data ?? []) as WeeklyPlan[];
  },
});
