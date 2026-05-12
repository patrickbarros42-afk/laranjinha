# CHECKLIST - Teste ponta a ponta do Meu Laranjinha

Use este checklist para sair do repositório local até o teste real via WhatsApp e preparação de deploy no Railway.

Legenda de status:

- `[x]` concluído no repositório
- `[ ]` pendente para execução manual
- `[~]` em andamento ou depende de credenciais externas

## 0. Links necessários

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase SQL Editor docs](https://supabase.com/docs/guides/database/overview)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Meta for Developers](https://developers.facebook.com/apps/)
- [WhatsApp Cloud API - Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [WhatsApp Cloud API - Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [ngrok](https://ngrok.com/)
- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Variables docs](https://docs.railway.app/guides/variables)

## 1. Conferência do projeto

| Status | Etapa | Como validar |
| --- | --- | --- |
| [x] | README revisado | `README.md` contém instalação, env, Supabase, WhatsApp e Railway |
| [x] | Schema Supabase criado | `supabase/schema.sql` contém `usuarios`, `transacoes`, `assinaturas`, índices e RLS |
| [x] | Env example criado | `.env.example` lista todas as variáveis necessárias |
| [x] | Railway configurado | `railway.json` define build e start |
| [x] | Backend organizado | `src/config`, `src/infra`, `src/modules`, `src/shared`, `src/types`, `src/prompts` |
| [x] | Typecheck local executado | `pnpm typecheck` |
| [x] | Build local executado | `pnpm build` |

## 2. Criar projeto no Supabase

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Acessar Supabase | Abra <https://supabase.com/dashboard> |
| [ ] | Criar novo projeto | Escolha organização, nome `meu-laranjinha`, senha do banco e região próxima ao Brasil |
| [ ] | Aguardar provisionamento | Espere o painel liberar Database/API settings |
| [ ] | Copiar Project URL | `Project Settings > API > Project URL` |
| [ ] | Copiar service role key | `Project Settings > API > service_role`; manter somente no backend |

## 3. Rodar `schema.sql`

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Abrir SQL Editor | No Supabase: `SQL Editor > New query` |
| [ ] | Colar schema | Copie todo o conteúdo de `supabase/schema.sql` |
| [ ] | Executar query | Clique em `Run` |
| [ ] | Conferir tabelas | `Table Editor` deve exibir `usuarios`, `transacoes`, `assinaturas` |
| [ ] | Conferir RLS | Cada tabela deve estar com RLS habilitado |

Query rápida de conferência:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('usuarios', 'transacoes', 'assinaturas');
```

## 4. Preencher `.env`

| Status | Etapa | Comando/valor |
| --- | --- | --- |
| [ ] | Criar arquivo local | `cp .env.example .env` |
| [ ] | Preencher Supabase | `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` |
| [ ] | Preencher OpenAI | `OPENAI_API_KEY` |
| [ ] | Definir verify token | `WHATSAPP_VERIFY_TOKEN=um-token-longo-e-secreto` |
| [ ] | Preencher Meta | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` |
| [ ] | Opcional: assinatura Meta | `META_APP_SECRET` com o App Secret da Meta |

Modelo mínimo para teste local:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
APP_TIMEZONE=America/Sao_Paulo
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
WHATSAPP_VERIFY_TOKEN=troque-por-um-token-secreto
WHATSAPP_ACCESS_TOKEN=SEU_TOKEN_META
WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_NUMBER_ID
WHATSAPP_API_VERSION=v22.0
META_APP_SECRET=
```

## 5. Rodar localmente

| Status | Etapa | Comando |
| --- | --- | --- |
| [ ] | Instalar dependências | `pnpm install` |
| [ ] | Validar TypeScript | `pnpm typecheck` |
| [ ] | Buildar produção | `pnpm build` |
| [ ] | Subir API local | `pnpm dev` |
| [ ] | Testar healthcheck | `curl http://localhost:3000/health` |

Resposta esperada:

```json
{
  "status": "ok",
  "service": "meu-laranjinha",
  "timestamp": "..."
}
```

## 6. Testar webhook do WhatsApp localmente

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Abrir túnel | `ngrok http 3000` |
| [ ] | Copiar URL pública | Exemplo: `https://abc123.ngrok-free.app` |
| [ ] | Configurar callback na Meta | `https://abc123.ngrok-free.app/webhooks/whatsapp/webhook` |
| [ ] | Informar verify token | Mesmo valor de `WHATSAPP_VERIFY_TOKEN` |
| [ ] | Clicar em Verify and save | A Meta deve aceitar o webhook |
| [ ] | Assinar campo `messages` | Em Webhooks, assine o evento `messages` |

Teste manual do endpoint de verificação:

```bash
curl "https://SUA-URL-NGROK/webhooks/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=123456"
```

Resposta esperada:

```txt
123456
```

## 7. Testar mensagem de texto

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Adicionar número de teste | No painel WhatsApp Cloud API, adicione seu número como recipient permitido |
| [ ] | Confirmar token ativo | Tokens temporários expiram; gere outro se necessário |
| [ ] | Enviar mensagem ao número da Meta | Pelo WhatsApp: `gastei 18 reais na padaria` |
| [ ] | Conferir resposta automática | Esperado: confirmação leve do Laranjinha |
| [ ] | Conferir Supabase | Tabela `usuarios` com telefone e `transacoes` com despesa |
| [ ] | Testar consulta do dia | Envie: `quanto gastei hoje?` |
| [ ] | Testar consulta do mês | Envie: `quanto gastei esse mês?` |
| [ ] | Testar categoria | Envie: `quanto gastei com ifood?` |
| [ ] | Testar resumo semanal | Envie: `resumo da semana` |
| [ ] | Testar resumo mensal | Envie: `resumo do mês` |

SQL para conferir transações:

```sql
select u.telefone, t.tipo, t.valor, t.categoria, t.descricao, t.data, t.created_at
from public.transacoes t
join public.usuarios u on u.id = t.usuario_id
order by t.created_at desc
limit 20;
```

## 8. Testar áudio

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Enviar áudio curto | Exemplo falado: "gastei 32 reais no mercado hoje" |
| [ ] | Conferir logs locais | Deve aparecer processamento sem erro de download/transcrição |
| [ ] | Conferir resposta | Laranjinha deve confirmar a transação |
| [ ] | Conferir Supabase | Nova linha em `transacoes` |

Observações:

- O token da Meta precisa permitir download de mídia.
- O arquivo de áudio é baixado via Graph API e transcrito com `OPENAI_TRANSCRIPTION_MODEL`.
- Se a transcrição falhar, confira `OPENAI_API_KEY`, saldo/limite da OpenAI e o tipo de mídia recebido.

## 9. Testar imagem/nota fiscal

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Enviar imagem | Envie uma nota fiscal ou foto qualquer |
| [ ] | Conferir resposta | MVP deve responder que OCR está preparado para etapa futura |
| [ ] | Garantir não-crash | Logs não devem mostrar erro fatal |

## 10. Preparar deploy no Railway

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Criar projeto Railway | Abra <https://railway.app/dashboard> |
| [ ] | Conectar repositório GitHub | Selecione este repositório |
| [ ] | Configurar variáveis | Copie as mesmas variáveis do `.env`, sem aspas |
| [ ] | Confirmar build command | `pnpm install --frozen-lockfile && pnpm build` |
| [ ] | Confirmar start command | `pnpm start` |
| [ ] | Fazer deploy | Railway deve expor uma URL pública |
| [ ] | Testar healthcheck Railway | `https://SUA-URL.up.railway.app/health` |
| [ ] | Atualizar webhook Meta | Callback: `https://SUA-URL.up.railway.app/webhooks/whatsapp/webhook` |
| [ ] | Testar texto em produção | Envie `gastei 18 reais na padaria` |
| [ ] | Testar áudio em produção | Envie áudio curto |

## 11. Problemas comuns

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| Meta não verifica webhook | URL errada ou token divergente | Conferir path `/webhooks/whatsapp/webhook` e `WHATSAPP_VERIFY_TOKEN` |
| API não sobe | `.env` incompleto | Verificar erro de Zod no terminal |
| WhatsApp não responde | Token Meta expirado ou phone number id errado | Gerar token novo e conferir `WHATSAPP_PHONE_NUMBER_ID` |
| Não salva no Supabase | Service role key incorreta ou schema não rodado | Conferir env e tabelas |
| OpenAI falha | Chave inválida, modelo indisponível ou sem saldo | Conferir `OPENAI_API_KEY`, billing e modelos |
| Áudio falha | Permissão/token de mídia ou transcrição | Conferir logs, token Meta e `OPENAI_TRANSCRIPTION_MODEL` |

## 12. Critério de pronto do MVP

| Status | Critério |
| --- | --- |
| [ ] | Texto "gastei 18 reais na padaria" cria usuário, cria transação e responde no WhatsApp |
| [ ] | Pergunta "quanto gastei hoje?" responde com total correto |
| [ ] | Pergunta "quanto gastei esse mês?" responde com total correto |
| [ ] | Pergunta "quanto gastei com ifood?" filtra descrição/categoria |
| [ ] | Áudio curto é transcrito, interpretado, salvo e respondido |
| [ ] | Imagem recebe resposta controlada sem quebrar o backend |
| [ ] | Deploy Railway passa build e `/health` responde |
| [ ] | Webhook Meta em produção recebe e processa mensagens |
