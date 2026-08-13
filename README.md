# Rangel Performance Hub

# Prompt de criação do RST no Lovable

Copie todo o conteúdo abaixo e use como primeiro prompt em um novo projeto do Lovable.

---

Crie o aplicativo web responsivo/PWA **Rangel System Training (RST)**. O produto é usado por personal trainers presenciais para registrar sessões em 1–2 minutos, acompanhar a evolução dos alunos e gerar contexto para o próximo atendimento.

Slogan oficial: **Treinar, registrar. Evoluir.**

## Objetivo desta implementação

Reconstruir no Lovable a Fase A já especificada, usando a stack nativa e suportada pelo Lovable. Use React + TypeScript e conecte o backend ao **Lovable Cloud ou Supabase/PostgreSQL**. Não use Cloudflare D1, Vinext ou armazenamento do navegador como fonte principal dos dados.

## Identidade visual

- Preto/grafite para estrutura.

- Laranja `#F36F21` para ações e destaques.

- Fundo branco ou cinza muito claro `#F5F5F2`.

- Visual premium, esportivo, limpo e profissional.

- Não usar roxo como cor principal.

- Não criar dashboard escuro genérico.

- Responsividade real para desktop, tablet e celular.

- Boa navegação por teclado e contraste acessível.

Use o arquivo `og.png` anexado como referência visual da marca, não como uma tela a ser copiada literalmente.

## Navegação principal

1. Visão geral.

2. Alunos.

3. Planejamento.

4. Nova sessão.

5. Histórico.

No celular, use navegação inferior compacta.

## Dashboard operacional

Mostrar alunos ativos, sessões previstas, realizadas, faltas/cancelamentos, atendimentos do dia e pontos de atenção. Priorizar a próxima ação e evitar gráficos decorativos.

## Alunos

Permitir cadastrar, listar, pesquisar e selecionar alunos. Campos:

- código público permanente;

- nome completo;

- nascimento;

- telefone;

- data de início;

- frequência semanal entre 2 e 5;

- objetivo principal;

- restrições;

- observações;

- status Ativo, Pausado ou Inativo.

O painel do aluno deve mostrar objetivo, frequência, próxima meta, total de sessões, energia média, dor média e exatamente as 3 sessões mais recentes.

## Planejamento semanal

Permitir criar de 2 a 5 sessões planejadas por aluno, mantendo planejamento separado da sessão realizada. Campos: início da semana, número semanal, data prevista, treino planejado, foco, status e observação.

Status: Planejado, Realizado, Falta, Cancelado ou Remarcado.

## Registro de sessão em uma única tela

Antes do formulário, mostrar a próxima meta e o resumo das 3 últimas sessões.

Bloco A — estado e sessão:

- aluno;

- planejamento relacionado opcional;

- data;

- número semanal;

- tipo de treino;

- presença: Presente, Reposição, Falta ou Cancelada;

- energia 1–10;

- dor 0–10;

- sono;

- humor;

- atraso;

- duração;

- considerações iniciais.

Bloco B — exercícios dinâmicos:

- ordem;

- nome livre;

- séries;

- repetições como texto, aceitando `8-12`, `15-12`, `10/8` e `falha`;

- cargas por série como texto, aceitando `30-50-70`;

- carga de referência numérica;

- unidade;

- RPE;

- observação individual.

Permitir adicionar, duplicar, remover e reordenar exercícios.

Bloco C — fechamento:

- pontos positivos;

- pontos de atenção;

- evolução percebida/observação final;

- próxima meta.

A próxima meta deve reaparecer no próximo atendimento.

## Regras obrigatórias

- Presente e Reposição exigem tipo de treino, duração e pelo menos um exercício.

- Falta e Cancelada não exigem exercícios.

- Bloquear duplicidade por profissional + aluno + data + número semanal.

- Salvar sessão, exercícios e atualização do planejamento na mesma transação.

- Nunca usar nome como chave.

- Manter histórico de aluno inativo.

- Não registrar peso corporal na sessão diária.

- Mostrar mensagens claras em português.

- Proteger todos os dados por `trainer_id`/conta autenticada usando políticas RLS no Supabase.

## Banco de dados

Criar migrations PostgreSQL versionadas para:

- profiles/trainers;

- students;

- weekly_plans;

- sessions;

- session_exercises;

- evaluations;

- evaluation_metrics;

- goals;

- score_configs;

- score_snapshots.

Configurar chaves estrangeiras, índices, unicidade, checks e Row Level Security. Use UUID interno e códigos públicos estáveis quando útil.

## Autenticação e dados demo

Criar autenticação por e-mail preparada para uso real. Incluir uma forma segura de carregar dados fictícios demonstrativos; nunca inserir dados reais de alunos no código.

## Testes

Cobrir criação de aluno, planejamento de 2–5 sessões, sessão presente, reposição, falta sem exercício, duplicidade, rollback transacional, textos de repetições/cargas, limites de energia/dor, próxima meta e exatamente 3 sessões recentes.

## Entrega

Implemente a aplicação funcional, não apenas um mockup. Valide desktop e celular. Ao terminar, mostre o que funciona e o que pertence às fases futuras: avaliações completas, evolução de carga, RST Score, relatório A4/PDF e importador oficial do Excel.

Consulte também os arquivos anexos `RST_PRODUCT_SPEC.md`, `RST_DATA_MODEL.md` e `RST_EXCEL_MIGRATION.md` para preservar as decisões de produto.

---

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9d9235cf-a277-4585-b588-3b7bce13263e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
