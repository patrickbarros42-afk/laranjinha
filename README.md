# Meu Laranjinha 🍊

Assistente financeiro via WhatsApp com IA. O usuário manda mensagens, áudios ou fotos de notas fiscais; o backend recebe webhooks da Z-API, interpreta com OpenAI, salva no Supabase e responde pelo WhatsApp com a personalidade brasileira do Laranjinha.

## Stack

- Node.js 20+
- TypeScript
- Express
- Supabase
- OpenAI API
- Z-API
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

1. Z-API envia webhook para `POST /webhooks/whatsapp/webhook`.
2. Backend valida o header `Client-Token` e, quando presente, o `instanceId`.
3. Mensagem é normalizada e usuário é criado/buscado pelo telefone.
4. Texto é enviado para OpenAI; áudio é baixado pela URL de mídia da Z-API e transcrito antes.
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
- Validação de webhook da Z-API.
- Recebimento de texto, áudio e imagem.
- Download de áudio recebido pela Z-API.
- Transcrição de áudio com OpenAI.
- Estrutura para imagem/nota fiscal com resposta de OCR futuro.
- Retry básico para Z-API.
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
| `SUPABASE_URL` | URL raiz do projeto Supabase: `https://vmzunivplxeqxyzzxskm.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key usada somente no backend |
| `OPENAI_API_KEY` | Chave da OpenAI |
| `OPENAI_MODEL` | Modelo para interpretar e responder |
| `OPENAI_TRANSCRIPTION_MODEL` | Modelo para transcrição de áudio |
| `ZAPI_BASE_URL` | Base da Z-API. Use `https://api.z-api.io` |
| `ZAPI_INSTANCE_ID` | ID da instância no painel da Z-API |
| `ZAPI_INSTANCE_TOKEN` | Token da instância no painel da Z-API |
| `ZAPI_CLIENT_TOKEN` | Token de segurança da conta, enviado no header `Client-Token` |

## Supabase setup

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Copie `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para o `.env`.

Use a URL raiz do projeto, sem `/rest/v1`:

```env
SUPABASE_URL=https://vmzunivplxeqxyzzxskm.supabase.co
```

Tabelas criadas:

- `usuarios`
- `transacoes`
- `assinaturas`

O schema habilita RLS e cria policies para `service_role`. A service role key deve ficar apenas no servidor. O fluxo atual cria/busca usuários em `usuarios`, registra movimentações em `transacoes` e cria uma assinatura `trial` em `assinaturas` para cada novo usuário.

Para testar a conexão com o banco depois de preencher `SUPABASE_SERVICE_ROLE_KEY`:

```bash
pnpm check:supabase
```

## Z-API

Documentação útil:

- <https://developer.z-api.io/>
- <https://developer.z-api.io/message/send-text.md>
- <https://developer.z-api.io/webhooks/on-message-received.md>
- <https://developer.z-api.io/webhooks/on-message-received-examples>
- <https://developer.z-api.io/instance/qr-code-image.md>

### Credenciais

No painel da Z-API, crie uma instância e copie:

- Instance ID -> `ZAPI_INSTANCE_ID`
- Instance Token -> `ZAPI_INSTANCE_TOKEN`
- Client Token -> `ZAPI_CLIENT_TOKEN`

Use:

```env
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=...
ZAPI_INSTANCE_TOKEN=...
ZAPI_CLIENT_TOKEN=...
```

### Callback URL

Configure no painel da Z-API, no webhook de mensagens recebidas:

```txt
https://seu-dominio.up.railway.app/webhooks/whatsapp/webhook
```

Para teste local:

```bash
pnpm dev
ngrok http 3000
```

Use a URL pública do ngrok:

```txt
https://abc123.ngrok-free.app/webhooks/whatsapp/webhook
```

### Validação do webhook

O backend espera que a Z-API envie:

```http
Client-Token: seu-zapi-client-token
```

Também valida `instanceId` quando o campo vem no payload.

### Teste manual sem conectar o número

Com a API local rodando e um ngrok aberto:

```bash
curl -X POST "https://SUA-URL-NGROK/webhooks/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "Client-Token: SEU_ZAPI_CLIENT_TOKEN" \
  -d '{
    "instanceId": "SEU_ZAPI_INSTANCE_ID",
    "messageId": "teste-001",
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

Esse teste exercita o webhook, OpenAI, Supabase e tentativa de resposta pela Z-API. Sem número conectado, marcar como lida ou enviar a resposta pode falhar na Z-API; isso é esperado até conectar a instância.

## OpenAI

Prompts ficam em:

- `src/prompts/finance-interpreter.prompt.ts`
- `src/prompts/laranjinha-reply.prompt.ts`

O interpretador retorna intenção JSON para:

- registrar transação
- consultar gastos/resumos
- pedir ajuda quando faltam dados

Áudios chegam pelo webhook da Z-API em `audio.audioUrl`, são baixados pelo backend e enviados para o modelo definido em `OPENAI_TRANSCRIPTION_MODEL`.

## Railway deploy

O projeto inclui `railway.json`.

1. Crie um serviço no Railway apontando para este repositório.
2. Configure as variáveis de ambiente.
3. Railway executará:

```bash
pnpm install --frozen-lockfile && pnpm build
pnpm start
```

4. Configure a URL pública no webhook de recebimento da Z-API.

## QR Code da Z-API

Ainda não é necessário conectar o número para deixar o backend preparado. Quando for conectar:

1. Acesse o painel da Z-API.
2. Abra a instância usada em `ZAPI_INSTANCE_ID`.
3. Clique para conectar via QR Code.
4. No celular que será o WhatsApp do Laranjinha, abra WhatsApp > Aparelhos conectados > Conectar aparelho.
5. Escaneie o QR Code exibido no painel.
6. Aguarde o status da instância ficar conectado.
7. Configure o webhook de mensagens recebidas para:

```txt
https://SEU-DOMINIO/webhooks/whatsapp/webhook
```

Se quiser buscar o QR Code via API em uma tela própria futuramente, use o endpoint de imagem da Z-API:

```txt
GET https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_INSTANCE_TOKEN}/qr-code/image
Header: Client-Token: {ZAPI_CLIENT_TOKEN}
```

## Scripts

```bash
pnpm dev        # desenvolvimento com tsx watch
pnpm build      # compila TypeScript para dist/
pnpm start      # roda dist/server.js
pnpm typecheck  # valida tipos sem emitir arquivos
pnpm check:supabase # valida URL, service role e acesso às tabelas
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

- Guarde tokens da Z-API somente no backend/Railway.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Ative o `Client-Token` no painel da Z-API e mantenha a validação ligada no backend.
- Ajuste `RATE_LIMIT_MAX` conforme tráfego real.
- Para OCR de nota fiscal, o módulo de imagem já isola o ponto de extensão.
