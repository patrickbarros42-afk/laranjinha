# CHECKLIST - Z-API + Meu Laranjinha

Checklist atualizado para testar o backend ponta a ponta com Z-API, OpenAI e Supabase. O numero ainda nao precisa ser conectado; as etapas de QR Code ficam preparadas para quando voce decidir ativar a instancia.

Legenda:

- `[x]` concluido no repositorio
- `[ ]` pendente para execucao manual
- `[~]` depende de credenciais externas

## 0. Links necessarios

- [Supabase Dashboard](https://supabase.com/dashboard)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Z-API Dashboard](https://app.z-api.io/)
- [Z-API Docs](https://developer.z-api.io/)
- [Z-API - Enviar texto](https://developer.z-api.io/message/send-text.md)
- [Z-API - Webhook ao receber](https://developer.z-api.io/webhooks/on-message-received.md)
- [Z-API - Exemplos de webhook](https://developer.z-api.io/webhooks/on-message-received-examples)
- [Z-API - QR Code imagem](https://developer.z-api.io/instance/qr-code-image.md)
- [Z-API - Client-Token](https://developer.z-api.io/security/client-token.md)
- [ngrok](https://ngrok.com/)
- [Railway Dashboard](https://railway.app/dashboard)

## 1. Conferencia do projeto

| Status | Etapa | Como validar |
| --- | --- | --- |
| [x] | README atualizado para Z-API | `README.md` documenta Z-API como camada WhatsApp |
| [x] | Variaveis Z-API no env example | `.env.example` contem `ZAPI_BASE_URL`, `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN` |
| [x] | URL Supabase real configurada | `.env.example` usa `https://vmzunivplxeqxyzzxskm.supabase.co` sem `/rest/v1` |
| [x] | Schema Supabase criado | `supabase/schema.sql` contem `usuarios`, `transacoes`, `assinaturas`, indices e RLS |
| [x] | Tabelas usadas pelo backend | `usuarios`, `transacoes` e `assinaturas` sao acessadas pelos repositories |
| [x] | Backend organizado | `src/config`, `src/infra`, `src/modules`, `src/shared`, `src/types`, `src/prompts` |
| [x] | Typecheck executado | `pnpm typecheck` |
| [x] | Build executado | `pnpm build` |

## 2. Criar projeto no Supabase

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [x] | Acessar Supabase | Projeto ja criado |
| [x] | Criar novo projeto | Projeto ja criado |
| [x] | Aguardar provisionamento | Projeto provisionado |
| [x] | Project URL configurada | `https://vmzunivplxeqxyzzxskm.supabase.co` |
| [ ] | Copiar service role key | `Project Settings > API > service_role`; usar somente no backend |

## 3. Rodar `schema.sql`

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [x] | Abrir SQL Editor | Schema ja executado |
| [x] | Colar schema | Schema ja executado |
| [x] | Executar query | Schema executado com sucesso |
| [x] | Conferir tabelas | `usuarios`, `transacoes`, `assinaturas` |
| [x] | Conferir RLS | RLS habilitado pelo `schema.sql` |

Query de conferencia:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('usuarios', 'transacoes', 'assinaturas');
```

## 4. Criar instancia Z-API

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Acessar painel Z-API | Abra <https://app.z-api.io/> |
| [ ] | Criar instancia | Crie uma instancia para o MVP |
| [ ] | Copiar Instance ID | Usar em `ZAPI_INSTANCE_ID` |
| [ ] | Copiar Instance Token | Usar em `ZAPI_INSTANCE_TOKEN` |
| [ ] | Gerar Client Token | Painel Z-API > Seguranca > Token de seguranca da conta |
| [ ] | Ativar Client Token | Ative somente depois de preencher o backend com o mesmo token |

## 5. Preencher `.env`

| Status | Etapa | Comando/valor |
| --- | --- | --- |
| [ ] | Criar arquivo local | `cp .env.example .env` |
| [x] | Conferir Supabase URL | `SUPABASE_URL=https://vmzunivplxeqxyzzxskm.supabase.co` |
| [ ] | Preencher Supabase key | `SUPABASE_SERVICE_ROLE_KEY` |
| [ ] | Preencher OpenAI | `OPENAI_API_KEY` |
| [ ] | Preencher Z-API | `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN` |

Modelo:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
APP_TIMEZONE=America/Sao_Paulo
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
SUPABASE_URL=https://vmzunivplxeqxyzzxskm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=SEU_INSTANCE_ID
ZAPI_INSTANCE_TOKEN=SEU_INSTANCE_TOKEN
ZAPI_CLIENT_TOKEN=SEU_CLIENT_TOKEN
```

## 6. Rodar localmente

| Status | Etapa | Comando |
| --- | --- | --- |
| [ ] | Instalar dependencias | `pnpm install` |
| [ ] | Testar Supabase | `pnpm check:supabase` |
| [ ] | Testar repositories | `pnpm check:repositories` |
| [ ] | Validar TypeScript | `pnpm typecheck` |
| [ ] | Buildar producao | `pnpm build` |
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

## 7. Testar webhook local sem conectar o numero

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Abrir tunel | `ngrok http 3000` |
| [ ] | Copiar URL publica | Exemplo: `https://abc123.ngrok-free.app` |
| [ ] | Testar info endpoint | `GET /webhooks/whatsapp/webhook` |
| [ ] | Enviar payload fake Z-API | Usar `Client-Token` igual ao `.env` |
| [ ] | Conferir logs | Deve aparecer `Z-API webhook received` |
| [ ] | Conferir Supabase | Deve criar usuario/transacao se Supabase e OpenAI estiverem configurados |

Info endpoint:

```bash
curl "http://localhost:3000/webhooks/whatsapp/webhook"
```

Payload fake de texto:

```bash
curl -X POST "http://localhost:3000/webhooks/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "Client-Token: SEU_ZAPI_CLIENT_TOKEN" \
  -d '{
    "instanceId": "SEU_ZAPI_INSTANCE_ID",
    "messageId": "teste-texto-001",
    "phone": "5511999999999",
    "fromMe": false,
    "isGroup": false,
    "momment": 1778590000000,
    "status": "RECEIVED",
    "senderName": "Teste Local",
    "type": "ReceivedCallback",
    "text": {
      "message": "gastei 18 reais na padaria"
    }
  }'
```

Observacao: sem numero conectado, o backend pode processar OpenAI/Supabase e falhar ao marcar como lida ou enviar a resposta pela Z-API. Isso e esperado ate conectar a instancia.

## 8. Configurar webhook na Z-API

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Abrir instancia Z-API | Painel Z-API > Instancia do MVP |
| [ ] | Abrir Webhooks | Configuracao de webhook de mensagens recebidas |
| [ ] | Definir URL local via ngrok | `https://SUA-URL-NGROK/webhooks/whatsapp/webhook` |
| [ ] | Salvar webhook | Z-API exige HTTPS |
| [ ] | Garantir Client-Token | Token configurado/ativo no painel e no `.env` |

## 9. Testar texto real depois de conectar

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Conectar numero via QR Code | Ver secao 12 |
| [ ] | Enviar mensagem ao numero conectado | `gastei 18 reais na padaria` |
| [ ] | Conferir resposta automatica | Laranjinha deve responder no WhatsApp |
| [ ] | Conferir Supabase | `usuarios` e `transacoes` atualizadas |
| [ ] | Testar consulta do dia | `quanto gastei hoje?` |
| [ ] | Testar consulta do mes | `quanto gastei esse mês?` |
| [ ] | Testar categoria | `quanto gastei com ifood?` |
| [ ] | Testar resumo semanal | `resumo da semana` |
| [ ] | Testar resumo mensal | `resumo do mês` |

SQL:

```sql
select u.telefone, t.tipo, t.valor, t.categoria, t.descricao, t.data, t.created_at
from public.transacoes t
join public.usuarios u on u.id = t.usuario_id
order by t.created_at desc
limit 20;
```

## 10. Testar audio real depois de conectar

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Enviar audio curto | Fale: "gastei 32 reais no mercado hoje" |
| [ ] | Conferir payload | Z-API deve enviar `audio.audioUrl` |
| [ ] | Conferir logs | Deve baixar midia e transcrever com OpenAI |
| [ ] | Conferir resposta | Laranjinha deve confirmar a transacao |
| [ ] | Conferir Supabase | Nova linha em `transacoes` |

Payload fake de audio para validar parser/download com uma URL propria:

```bash
curl -X POST "http://localhost:3000/webhooks/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "Client-Token: SEU_ZAPI_CLIENT_TOKEN" \
  -d '{
    "instanceId": "SEU_ZAPI_INSTANCE_ID",
    "messageId": "teste-audio-001",
    "phone": "5511999999999",
    "fromMe": false,
    "isGroup": false,
    "momment": 1778590000000,
    "status": "RECEIVED",
    "senderName": "Teste Local",
    "type": "ReceivedCallback",
    "audio": {
      "ptt": true,
      "seconds": 4,
      "audioUrl": "https://URL-PUBLICA-DE-UM-ARQUIVO.ogg",
      "mimeType": "audio/ogg; codecs=opus"
    }
  }'
```

## 11. Testar imagem/nota fiscal

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Enviar imagem real | Depois de conectar o numero |
| [ ] | Conferir resposta | MVP responde que OCR fica para etapa futura |
| [ ] | Garantir nao-crash | Logs sem erro fatal |

## 12. Como conectar o QR Code depois

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Abrir Z-API Dashboard | <https://app.z-api.io/> |
| [ ] | Entrar na instancia | A mesma de `ZAPI_INSTANCE_ID` |
| [ ] | Abrir conexao por QR Code | Painel da instancia > conectar WhatsApp |
| [ ] | Abrir WhatsApp no celular | WhatsApp > Aparelhos conectados |
| [ ] | Conectar aparelho | Escaneie o QR Code exibido na Z-API |
| [ ] | Aguardar status conectado | A instancia deve ficar `connected=true` |
| [ ] | Confirmar webhook | URL deve apontar para `/webhooks/whatsapp/webhook` |

Opcional via API, para tela propria futura:

```bash
curl "https://api.z-api.io/instances/SEU_INSTANCE_ID/token/SEU_INSTANCE_TOKEN/qr-code/image" \
  -H "Client-Token: SEU_CLIENT_TOKEN"
```

Boas praticas:

- Busque um QR Code novo a cada 10 a 20 segundos.
- Pare depois de 3 tentativas sem scan e ofereca um botao para gerar novamente.
- O WhatsApp invalida QR Codes rapidamente.

## 13. Preparar deploy no Railway

| Status | Etapa | Detalhes |
| --- | --- | --- |
| [ ] | Criar projeto Railway | Abra <https://railway.app/dashboard> |
| [ ] | Conectar GitHub | Selecione este repositorio |
| [ ] | Configurar variaveis | Copie as mesmas variaveis do `.env` |
| [ ] | Confirmar build command | `pnpm install --frozen-lockfile && pnpm build` |
| [ ] | Confirmar start command | `pnpm start` |
| [ ] | Fazer deploy | Railway deve gerar URL publica |
| [ ] | Testar healthcheck | `https://SUA-URL.up.railway.app/health` |
| [ ] | Atualizar webhook Z-API | `https://SUA-URL.up.railway.app/webhooks/whatsapp/webhook` |
| [ ] | Testar texto em producao | Depois de conectar o numero |
| [ ] | Testar audio em producao | Depois de conectar o numero |

## 14. Problemas comuns

| Sintoma | Causa provavel | Correcao |
| --- | --- | --- |
| Webhook retorna 401 | `Client-Token` ausente ou diferente | Conferir `ZAPI_CLIENT_TOKEN` no painel, `.env` e request |
| Payload ignorado | `fromMe=true`, grupo ou `type` diferente de `ReceivedCallback` | Testar com mensagem individual recebida |
| API nao sobe | `.env` incompleto | Ver erro de Zod no terminal |
| Nao salva no Supabase | Service role key errada ou schema nao rodado | Conferir env e tabelas |
| OpenAI falha | Chave invalida, modelo indisponivel ou sem saldo | Conferir `OPENAI_API_KEY`, billing e modelos |
| Resposta nao chega no WhatsApp | Instancia Z-API desconectada ou token errado | Conectar QR Code e conferir credenciais |
| Audio falha | `audioUrl` expirado/privado ou transcricao indisponivel | Reenviar audio e conferir `OPENAI_TRANSCRIPTION_MODEL` |

## 15. Criterio de pronto do MVP

| Status | Criterio |
| --- | --- |
| [ ] | Webhook Z-API com texto cria usuario, cria transacao e tenta responder |
| [ ] | Numero conectado via QR Code |
| [ ] | Texto "gastei 18 reais na padaria" responde no WhatsApp |
| [ ] | Pergunta "quanto gastei hoje?" responde total correto |
| [ ] | Pergunta "quanto gastei esse mês?" responde total correto |
| [ ] | Pergunta "quanto gastei com ifood?" filtra descricao/categoria |
| [ ] | Audio curto e transcrito, interpretado, salvo e respondido |
| [ ] | Imagem recebe resposta controlada sem quebrar backend |
| [ ] | Deploy Railway passa build e `/health` responde |
| [ ] | Webhook Z-API em producao recebe e processa mensagens |
