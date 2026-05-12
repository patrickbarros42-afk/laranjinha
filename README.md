# Meu Laranjinha 🍊

Assistente financeiro via WhatsApp com IA. O usuário manda mensagens, áudios ou fotos de notas fiscais; o backend interpreta com OpenAI, salva no Supabase e responde pelo WhatsApp Cloud API com a personalidade brasileira do Laranjinha.

## Stack

- Node.js 20+
- TypeScript
- Express
- Supabase
- OpenAI API
- WhatsApp Cloud API
- Railway
- pnpm
- dotenv + Zod
- Helmet, CORS, rate limiting, logs estruturados com Pino

## Arquitetura

```txt
src/
  app.ts
  server.ts
  config/
    env.ts
    http.ts
  infra/
    openai/
    supabase/
  modules/
    ai/
    finance/
    health/
    transactions/
    users/
    whatsapp/
  prompts/
  shared/
    errors/
    middlewares/
    utils/
  types/
supabase/
  schema.sql
```

### Fluxo MVP

1. Meta envia webhook para `POST /webhooks/whatsapp/webhook`.
2. Backend valida assinatura opcional `X-Hub-Signature-256`.
3. Mensagem é normalizada e usuário é criado/buscado pelo telefone.
4. Texto é enviado para OpenAI; áudio é baixado do WhatsApp e transcrito antes.
5. IA retorna JSON estruturado:

```json
{
  "tipo": "despesa",
  "valor": 18,
  "categoria": "alimentacao",
  "descricao": "padaria",
  "data": "2026-05-11"
}
```

6. Transação é salva em `transacoes`.
7. Laranjinha responde automaticamente pelo WhatsApp.

## Funcionalidades implementadas

- Cadastro automático de usuários por telefone.
- Cadastro de despesas.
- Cadastro de receitas.
- Categorias automáticas.
- Perguntas:
  - `quanto gastei hoje?`
  - `quanto gastei esse mês?`
  - `quanto gastei com ifood?`
  - `resumo da semana`
  - `resumo do mês`
- Webhook verification da Meta.
- Recebimento de texto, áudio e imagem.
- Download de áudio do WhatsApp.
- Transcrição de áudio com OpenAI.
- Estrutura para imagem/nota fiscal com resposta de OCR futuro.
- Retry básico para WhatsApp Cloud API.
- Logs, error handling, helmet, cors e rate limiting.

## Instalação local

```bash
pnpm install
cp .env.example .env
pnpm dev
```

API local:

```bash
curl http://localhost:3000/health
```

## Variáveis de ambiente

Veja `.env.example`.

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | `development`, `test` ou `production` |
| `PORT` | Porta HTTP |
| `LOG_LEVEL` | Nível do Pino (`info`, `debug`, `warn`, `error`) |
| `APP_TIMEZONE` | Fuso de referência do app |
| `CORS_ORIGIN` | Lista separada por vírgula ou `*` |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit |
| `RATE_LIMIT_MAX` | Máximo de requests por janela |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key usada somente no backend |
| `OPENAI_API_KEY` | Chave da OpenAI |
| `OPENAI_MODEL` | Modelo para interpretar e responder |
| `OPENAI_TRANSCRIPTION_MODEL` | Modelo para transcrição de áudio |
| `WHATSAPP_VERIFY_TOKEN` | Token configurado no webhook da Meta |
| `WHATSAPP_ACCESS_TOKEN` | Token do WhatsApp Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID da Meta |
| `WHATSAPP_API_VERSION` | Versão do Graph API |
| `META_APP_SECRET` | Opcional; valida assinatura do webhook |

## Supabase setup

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Copie `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para o `.env`.

Tabelas criadas:

- `usuarios`
- `transacoes`
- `assinaturas`

O schema habilita RLS e cria policies para `service_role`. A service role key deve ficar apenas no servidor.

## WhatsApp Cloud API

### Callback URL

Configure no app da Meta:

```txt
https://seu-dominio.up.railway.app/webhooks/whatsapp/webhook
```

### Verify token

Use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`.

### Webhook fields

Assine pelo menos:

- `messages`

### Teste local com túnel

```bash
pnpm dev
ngrok http 3000
```

Use a URL pública do ngrok como callback do webhook.

## OpenAI

Prompts ficam em:

- `src/prompts/finance-interpreter.prompt.ts`
- `src/prompts/laranjinha-reply.prompt.ts`

O interpretador retorna intenção JSON para:

- registrar transação
- consultar gastos/resumos
- pedir ajuda quando faltam dados

Áudios são baixados da Meta e enviados para o modelo definido em `OPENAI_TRANSCRIPTION_MODEL`.

## Railway deploy

O projeto inclui `railway.json`.

1. Crie um serviço no Railway apontando para este repositório.
2. Configure as variáveis de ambiente.
3. Railway executará:

```bash
pnpm install --frozen-lockfile && pnpm build
pnpm start
```

4. Configure a URL pública no webhook da Meta.

## Scripts

```bash
pnpm dev        # desenvolvimento com tsx watch
pnpm build      # compila TypeScript para dist/
pnpm start      # roda dist/server.js
pnpm typecheck  # valida tipos sem emitir arquivos
pnpm test       # executa vitest
pnpm lint       # alias para typecheck no MVP
```

## Exemplos de uso

Usuário:

```txt
gastei 18 reais na padaria
```

Resposta:

```txt
Anotado, patrão 😅 Despesa anotada: R$ 18,00 em padaria (alimentacao).
```

Usuário:

```txt
quanto gastei esse mês?
```

Resposta:

```txt
Você gastou R$ 482,30 este mês. Maior categoria: alimentacao (R$ 210,00). Tô de olho hein 👀
```

## Notas de produção

- Use tokens permanentes/rotacionados da Meta em ambiente seguro.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Configure `META_APP_SECRET` para validar assinatura dos webhooks.
- Ajuste `RATE_LIMIT_MAX` conforme tráfego real.
- Para OCR de nota fiscal, o módulo de imagem já isola o ponto de extensão.
