import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { studentsQuery } from "@/lib/queries";
import { STUDENT_STATUS_LABEL, formatDate, suggestCode, todayISO } from "@/lib/rst";
import type { StudentStatus } from "@/lib/rst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/alunos/")({
  head: () => ({
    meta: [
      { title: "Alunos — RST" },
      { name: "description", content: "Cadastro, busca e seleção de alunos no Rangel System Training." },
      { property: "og:title", content: "Alunos — RST" },
      { property: "og:description", content: "Cadastro e acompanhamento dos alunos do personal trainer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentsPage,
});

const schema = z.object({
  public_code: z.string().trim().min(2, "Informe o código público.").max(30),
  full_name: z.string().trim().min(2, "Informe o nome completo.").max(120),
  birth_date: z.string().optional(),
  phone: z.string().trim().max(30).optional(),
  start_date: z.string().optional(),
  weekly_frequency: z.number().int().min(2, "Frequência entre 2 e 5.").max(5, "Frequência entre 2 e 5."),
  main_goal: z.string().trim().max(200).optional(),
  restrictions: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(["ativo", "pausado", "inativo"]),
});

function StudentsPage() {
  const queryClient = useQueryClient();
  const students = useQuery(studentsQuery);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const codes = (students.data ?? []).map((s) => s.public_code);
  const [form, setForm] = useState(() => emptyForm());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (students.data ?? []).filter(
      (s) =>
        !term ||
        s.full_name.toLowerCase().includes(term) ||
        s.public_code.toLowerCase().includes(term),
    );
  }, [students.data, search]);

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        ...form,
        weekly_frequency: Number(form.weekly_frequency),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      const payload = parsed.data;
      const { error } = await supabase.from("students").insert({
        public_code: payload.public_code,
        full_name: payload.full_name,
        birth_date: payload.birth_date || null,
        phone: payload.phone || null,
        start_date: payload.start_date || null,
        weekly_frequency: payload.weekly_frequency,
        main_goal: payload.main_goal || null,
        restrictions: payload.restrictions || null,
        notes: payload.notes || null,
        status: payload.status as StudentStatus,
      });
      if (error) {
        throw new Error(
          error.code === "23505"
            ? "Já existe um aluno com este código público."
            : error.message,
        );
      }
    },
    onSuccess: () => {
      toast.success("Aluno cadastrado.");
      setForm(emptyForm());
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Cadastro"
        title="Alunos"
        description="Cada aluno tem código público permanente; o nome nunca é usado como chave."
        action={
          <Button
            onClick={() => {
              setForm({ ...emptyForm(), public_code: suggestCode(codes) });
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Fechar formulário" : "Novo aluno"}
          </Button>
        }
      />

      {showForm ? (
        <form
          className="rst-surface mb-6 grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Código público" htmlFor="codigo">
            <Input
              id="codigo"
              value={form.public_code}
              onChange={(e) => setForm({ ...form, public_code: e.target.value })}
              required
            />
          </Field>
          <Field label="Nome completo" htmlFor="nome">
            <Input
              id="nome"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </Field>
          <Field label="Nascimento" htmlFor="nasc">
            <Input
              id="nasc"
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            />
          </Field>
          <Field label="Telefone" htmlFor="tel">
            <Input
              id="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Data de início" htmlFor="inicio">
            <Input
              id="inicio"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </Field>
          <Field label="Frequência semanal (2 a 5)" htmlFor="freq">
            <Input
              id="freq"
              type="number"
              min={2}
              max={5}
              value={form.weekly_frequency}
              onChange={(e) => setForm({ ...form, weekly_frequency: e.target.value })}
              required
            />
          </Field>
          <Field label="Objetivo principal" htmlFor="objetivo">
            <Input
              id="objetivo"
              value={form.main_goal}
              onChange={(e) => setForm({ ...form, main_goal: e.target.value })}
            />
          </Field>
          <Field label="Status" htmlFor="status">
            <select
              id="status"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
            >
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
          <Field label="Restrições" htmlFor="restr" full>
            <Textarea
              id="restr"
              value={form.restrictions}
              onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
              rows={2}
            />
          </Field>
          <Field label="Observações" htmlFor="obs" full>
            <Textarea
              id="obs"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando..." : "Salvar aluno"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 max-w-sm">
        <Label htmlFor="busca" className="sr-only">
          Pesquisar aluno
        </Label>
        <Input
          id="busca"
          placeholder="Pesquisar por nome ou código"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {students.isLoading ? <p className="text-sm text-muted-foreground">Carregando alunos...</p> : null}
      {!students.isLoading && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {filtered.map((student) => (
          <li key={student.id}>
            <Link
              to="/alunos/$studentId"
              params={{ studentId: student.id }}
              className="rst-surface block p-4 transition-shadow hover:shadow-[var(--shadow-raise)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold">
                    {student.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.public_code} · {student.weekly_frequency}x por semana · início{" "}
                    {formatDate(student.start_date)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    student.status === "ativo"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {STUDENT_STATUS_LABEL[student.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {student.main_goal ?? "Objetivo não informado"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
  full,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function emptyForm() {
  return {
    public_code: "",
    full_name: "",
    birth_date: "",
    phone: "",
    start_date: todayISO(),
    weekly_frequency: "3",
    main_goal: "",
    restrictions: "",
    notes: "",
    status: "ativo" as StudentStatus,
  };
}
