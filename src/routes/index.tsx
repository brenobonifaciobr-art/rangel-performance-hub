import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/visao-geral" });
  },
  head: () => ({
    meta: [
      { title: "Rangel System Training — Treinar, registrar. Evoluir." },
      {
        name: "description",
        content:
          "Sistema de registro de sessões para personal trainers: anote o treino em 1 a 2 minutos e acompanhe a evolução de cada aluno.",
      },
      { property: "og:title", content: "Rangel System Training (RST)" },
      { property: "og:description", content: "Treinar, registrar. Evoluir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
