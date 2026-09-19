# Publicação automática (sem usar o Lovable)

Depois de configurado, o fluxo é apenas: `git push` na `main`.

## O que acontece a cada push na main

1. `build` — instala dependências e compila a aplicação. Se quebrar, nada vai ao ar.
2. `migrations` — aplica os arquivos de `supabase/migrations` no banco (só roda se o segredo `SUPABASE_DB_URL` existir).
3. `publish` — republica o site em https://rangel-trainer-hub.lovable.app e espera confirmar que ficou no ar.

## Segredos a cadastrar no GitHub

Em **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Obrigatório | Onde obter |
| --- | --- | --- |
| `LOVABLE_API_KEY` | Sim | Configurações da conta Lovable → Access tokens (chave `lov_...`; requer plano Business/Enterprise, perfil owner ou admin). |
| `SUPABASE_DB_URL` | Só se quiser migrations automáticas | String de conexão Postgres do banco. Em projetos Lovable Cloud a senha do banco não é exposta; nesse caso deixe sem o segredo e faça as mudanças de banco pelo Lovable. |

Sem `SUPABASE_DB_URL`, o passo de banco é simplesmente pulado e o resto continua automático.

## Rodar manualmente

Aba **Actions → Deploy → Run workflow**.
