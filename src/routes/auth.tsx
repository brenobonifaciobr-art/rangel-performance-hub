import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no RST — Rangel System Training" },
      {
        name: "description",
        content:
          "Acesse sua conta do RST para registrar sessões, acompanhar alunos e planejar a semana.",
      },
      { property: "og:title", content: "Entrar no RST — Rangel System Training" },
      {
        property: "og:description",
        content: "Acesse sua conta do RST para registrar sessões e acompanhar a evolução dos alunos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/visao-geral", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "criar") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/visao-geral", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/visao-geral", replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir.";
      toast.error(
        message.includes("Invalid login credentials") ? "E-mail ou senha incorretos." : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-graphite p-10 text-graphite-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded bg-primary font-[family-name:var(--font-display)] text-lg font-black text-primary-foreground">
            R
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-extrabold">RST</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl font-extrabold leading-tight">
            Treinar, registrar. <span className="text-primary">Evoluir.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm text-graphite-foreground/70">
            Registre a aula em 1 a 2 minutos e chegue no próximo atendimento com o contexto pronto.
          </p>
        </div>
        <p className="text-xs text-graphite-foreground/50">Rangel System Training</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold">
            {mode === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso do profissional. Cada conta enxerga apenas os próprios alunos.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "criar" ? (
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={mode === "criar" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "entrar" ? "criar" : "entrar")}
          >
            {mode === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
