CREATE TYPE public.student_status AS ENUM ('ativo','pausado','inativo');
CREATE TYPE public.plan_status AS ENUM ('planejado','realizado','falta','cancelado','remarcado');
CREATE TYPE public.attendance AS ENUM ('presente','reposicao','falta','cancelada');
CREATE TYPE public.goal_status AS ENUM ('ativo','concluido','arquivado');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  public_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  start_date DATE,
  weekly_frequency INT NOT NULL DEFAULT 3 CHECK (weekly_frequency BETWEEN 2 AND 5),
  main_goal TEXT,
  restrictions TEXT,
  notes TEXT,
  status public.student_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, public_code)
);
CREATE INDEX idx_students_trainer ON public.students(trainer_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own students" ON public.students FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 5),
  planned_date DATE,
  planned_workout TEXT,
  focus TEXT,
  status public.plan_status NOT NULL DEFAULT 'planejado',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, student_id, week_start, week_number)
);
CREATE INDEX idx_plans_student ON public.weekly_plans(student_id, week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_plans TO authenticated;
GRANT ALL ON public.weekly_plans TO service_role;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.weekly_plans FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.weekly_plans(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 5),
  workout_type TEXT,
  attendance public.attendance NOT NULL,
  energy INT CHECK (energy BETWEEN 1 AND 10),
  pain INT CHECK (pain BETWEEN 0 AND 10),
  sleep TEXT,
  mood TEXT,
  late_minutes INT CHECK (late_minutes >= 0),
  duration_minutes INT CHECK (duration_minutes > 0),
  initial_notes TEXT,
  positives TEXT,
  attention_points TEXT,
  evolution_notes TEXT,
  next_goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, student_id, session_date, week_number)
);
CREATE INDEX idx_sessions_student_date ON public.sessions(student_id, session_date DESC);
CREATE INDEX idx_sessions_trainer_date ON public.sessions(trainer_id, session_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.sessions FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  name TEXT NOT NULL,
  sets INT CHECK (sets > 0),
  reps_text TEXT,
  loads_text TEXT,
  reference_load NUMERIC,
  unit TEXT DEFAULT 'kg',
  rpe NUMERIC CHECK (rpe >= 0 AND rpe <= 10),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercises_session ON public.session_exercises(session_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_exercises TO authenticated;
GRANT ALL ON public.session_exercises TO service_role;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exercises" ON public.session_exercises FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  evaluated_on DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evaluations_student ON public.evaluations(student_id, evaluated_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own evaluations" ON public.evaluations FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE TABLE public.evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC,
  metric_text TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, metric_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_metrics TO authenticated;
GRANT ALL ON public.evaluation_metrics TO service_role;
ALTER TABLE public.evaluation_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own metrics" ON public.evaluation_metrics FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  status public.goal_status NOT NULL DEFAULT 'ativo',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_student ON public.goals(student_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.score_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  version INT NOT NULL DEFAULT 1,
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_configs TO authenticated;
GRANT ALL ON public.score_configs TO service_role;
ALTER TABLE public.score_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own score configs" ON public.score_configs FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE TABLE public.score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL DEFAULT auth.uid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.score_configs(id) ON DELETE SET NULL,
  reference_date DATE NOT NULL,
  score NUMERIC NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, reference_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_snapshots TO authenticated;
GRANT ALL ON public.score_snapshots TO service_role;
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.score_snapshots FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);