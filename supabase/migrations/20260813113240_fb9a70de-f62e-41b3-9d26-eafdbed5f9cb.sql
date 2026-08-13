REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_session(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_student UUID := (payload->>'student_id')::uuid;
  v_attendance public.attendance := (payload->>'attendance')::public.attendance;
  v_date DATE := (payload->>'session_date')::date;
  v_week INT := (payload->>'week_number')::int;
  v_plan UUID := NULLIF(payload->>'plan_id','')::uuid;
  v_exercises JSONB := COALESCE(payload->'exercises','[]'::jsonb);
  v_session UUID;
  v_ex JSONB;
  v_pos INT := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sessão expirada. Entre novamente para salvar.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = v_student AND s.trainer_id = v_uid) THEN
    RAISE EXCEPTION 'Aluno não encontrado nesta conta.';
  END IF;

  IF v_attendance IN ('presente','reposicao') THEN
    IF COALESCE(NULLIF(trim(payload->>'workout_type'),''), '') = '' THEN
      RAISE EXCEPTION 'Informe o tipo de treino para presença ou reposição.';
    END IF;
    IF COALESCE((payload->>'duration_minutes')::int, 0) <= 0 THEN
      RAISE EXCEPTION 'Informe a duração da sessão para presença ou reposição.';
    END IF;
    IF jsonb_array_length(v_exercises) < 1 THEN
      RAISE EXCEPTION 'Registre pelo menos um exercício para presença ou reposição.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.trainer_id = v_uid AND s.student_id = v_student
      AND s.session_date = v_date AND s.week_number = v_week
  ) THEN
    RAISE EXCEPTION 'Já existe uma sessão registrada para este aluno nesta data e número semanal.';
  END IF;

  INSERT INTO public.sessions (
    trainer_id, student_id, plan_id, session_date, week_number, workout_type, attendance,
    energy, pain, sleep, mood, late_minutes, duration_minutes, initial_notes,
    positives, attention_points, evolution_notes, next_goal
  ) VALUES (
    v_uid, v_student, v_plan, v_date, v_week,
    NULLIF(trim(COALESCE(payload->>'workout_type','')),''), v_attendance,
    NULLIF(payload->>'energy','')::int,
    NULLIF(payload->>'pain','')::int,
    NULLIF(trim(COALESCE(payload->>'sleep','')),''),
    NULLIF(trim(COALESCE(payload->>'mood','')),''),
    NULLIF(payload->>'late_minutes','')::int,
    NULLIF(payload->>'duration_minutes','')::int,
    NULLIF(trim(COALESCE(payload->>'initial_notes','')),''),
    NULLIF(trim(COALESCE(payload->>'positives','')),''),
    NULLIF(trim(COALESCE(payload->>'attention_points','')),''),
    NULLIF(trim(COALESCE(payload->>'evolution_notes','')),''),
    NULLIF(trim(COALESCE(payload->>'next_goal','')),'')
  ) RETURNING id INTO v_session;

  FOR v_ex IN SELECT * FROM jsonb_array_elements(v_exercises) LOOP
    v_pos := v_pos + 1;
    IF COALESCE(NULLIF(trim(v_ex->>'name'),''),'') = '' THEN
      RAISE EXCEPTION 'Todo exercício precisa de um nome.';
    END IF;
    INSERT INTO public.session_exercises (
      trainer_id, session_id, position, name, sets, reps_text, loads_text,
      reference_load, unit, rpe, note
    ) VALUES (
      v_uid, v_session, v_pos, trim(v_ex->>'name'),
      NULLIF(v_ex->>'sets','')::int,
      NULLIF(trim(COALESCE(v_ex->>'reps_text','')),''),
      NULLIF(trim(COALESCE(v_ex->>'loads_text','')),''),
      NULLIF(v_ex->>'reference_load','')::numeric,
      COALESCE(NULLIF(trim(COALESCE(v_ex->>'unit','')),''),'kg'),
      NULLIF(v_ex->>'rpe','')::numeric,
      NULLIF(trim(COALESCE(v_ex->>'note','')),'')
    );
  END LOOP;

  IF v_plan IS NOT NULL THEN
    UPDATE public.weekly_plans p
    SET status = CASE v_attendance
        WHEN 'presente' THEN 'realizado'::public.plan_status
        WHEN 'reposicao' THEN 'realizado'::public.plan_status
        WHEN 'falta' THEN 'falta'::public.plan_status
        ELSE 'cancelado'::public.plan_status END
    WHERE p.id = v_plan AND p.trainer_id = v_uid;
  END IF;

  RETURN v_session;
END; $$;

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_names TEXT[] := ARRAY['Ana Demo','Bruno Demo','Carla Demo','Diego Demo'];
  v_goals TEXT[] := ARRAY['Ganho de força','Emagrecimento','Condicionamento','Reabilitação de ombro'];
  v_student UUID;
  i INT;
  d INT;
  v_session UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Entre na sua conta para carregar os dados demonstrativos.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.students WHERE trainer_id = v_uid AND public_code LIKE 'DEMO-%') THEN
    RETURN 'Os dados demonstrativos já estão carregados.';
  END IF;

  FOR i IN 1..4 LOOP
    INSERT INTO public.students (trainer_id, public_code, full_name, birth_date, phone, start_date,
      weekly_frequency, main_goal, restrictions, notes, status)
    VALUES (v_uid, 'DEMO-' || lpad(i::text,3,'0'), v_names[i],
      (DATE '1990-01-01' + (i * 400)), '(11) 90000-000' || i,
      CURRENT_DATE - 90, 2 + (i % 4), v_goals[i],
      CASE WHEN i = 4 THEN 'Evitar elevação acima da linha do ombro' ELSE NULL END,
      'Aluno fictício para demonstração.', 'ativo')
    RETURNING id INTO v_student;

    FOR d IN 1..3 LOOP
      INSERT INTO public.weekly_plans (trainer_id, student_id, week_start, week_number, planned_date,
        planned_workout, focus, status)
      VALUES (v_uid, v_student, date_trunc('week', CURRENT_DATE)::date, d,
        date_trunc('week', CURRENT_DATE)::date + (d - 1) * 2,
        'Treino ' || chr(64 + d), v_goals[i], 'planejado');
    END LOOP;

    FOR d IN 1..4 LOOP
      INSERT INTO public.sessions (trainer_id, student_id, session_date, week_number, workout_type,
        attendance, energy, pain, sleep, mood, late_minutes, duration_minutes,
        initial_notes, positives, attention_points, evolution_notes, next_goal)
      VALUES (v_uid, v_student, CURRENT_DATE - (d * 3), ((d - 1) % 5) + 1, 'Treino ' || chr(64 + ((d - 1) % 3)),
        'presente', 6 + (d % 4), (d % 3), 'Boa', 'Motivado', 0, 55,
        'Chegou bem disposto.', 'Boa execução técnica.', 'Atenção à postura no agachamento.',
        'Evolução consistente na carga.', 'Aumentar carga no supino em 2,5 kg')
      RETURNING id INTO v_session;

      INSERT INTO public.session_exercises (trainer_id, session_id, position, name, sets, reps_text,
        loads_text, reference_load, unit, rpe, note)
      VALUES
        (v_uid, v_session, 1, 'Agachamento livre', 4, '8-12', '30-40-50-50', 50, 'kg', 8, 'Boa profundidade'),
        (v_uid, v_session, 2, 'Supino reto', 3, '10/8', '30-35-35', 35, 'kg', 7, NULL),
        (v_uid, v_session, 3, 'Remada baixa', 3, 'falha', '40-45-45', 45, 'kg', 9, 'Última série até a falha');
    END LOOP;

    INSERT INTO public.goals (trainer_id, student_id, description, priority, status)
    VALUES (v_uid, v_student, 'Meta demonstrativa: consolidar frequência semanal', 1, 'ativo');
  END LOOP;

  RETURN 'Dados demonstrativos carregados com sucesso.';
END; $$;