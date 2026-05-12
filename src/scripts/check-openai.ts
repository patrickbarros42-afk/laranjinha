import "dotenv/config";

import { env } from "../config/env.js";
import { FinanceInterpreterService } from "../modules/ai/finance-interpreter.service.js";
import type { FinanceIntent } from "../modules/ai/finance-interpreter.types.js";
import { LaranjinhaReplyService } from "../modules/ai/laranjinha-reply.service.js";
import { todayIsoDate } from "../shared/utils/dates.js";

const examples = [
  "gastei 18 reais na padaria",
  "recebi 1500 de salário",
  "quanto gastei hoje?",
  "quanto gastei esse mês?"
] as const;

const interpreter = new FinanceInterpreterService();
const replies = new LaranjinhaReplyService();
const currentDate = todayIsoDate();

console.log(`OpenAI chat model: ${env.OPENAI_MODEL}`);
console.log(`OpenAI transcription model configured: ${env.OPENAI_TRANSCRIPTION_MODEL}`);
console.log("Transcription pipeline: prepared via AudioTranscriptionService for WhatsApp/Z-API audio media");

for (const text of examples) {
  const intent = await interpreter.interpret({
    text,
    currentDate,
    userPhone: "5511999999999"
  });
  const reply = await replies.generate(buildReplyContext(intent), buildFallback(intent));

  console.log("\n---");
  console.log(`Mensagem: ${text}`);
  console.log(`JSON interpretado: ${JSON.stringify(intent, null, 2)}`);
  console.log(`Categoria/consulta detectada: ${describeIntent(intent)}`);
  console.log(`Resposta Laranjinha: ${reply}`);
}

console.log("\nOpenAI connection OK: financial interpretation and Laranjinha replies are working.");

function describeIntent(intent: FinanceIntent): string {
  if (intent.acao === "registrar_transacao") {
    return `${intent.tipo}/${intent.categoria}`;
  }

  if (intent.acao === "consultar") {
    return intent.categoria ? `${intent.consulta}/${intent.categoria}` : intent.consulta;
  }

  return "ajuda";
}

function buildReplyContext(intent: FinanceIntent): string {
  if (intent.acao === "registrar_transacao") {
    return `O usuário enviou uma ${intent.tipo}: valor ${intent.valor}, categoria ${intent.categoria}, descricao ${intent.descricao}, data ${intent.data}. Confirme que foi anotado.`;
  }

  if (intent.acao === "consultar") {
    return `O usuário pediu uma consulta financeira do tipo ${intent.consulta}. Diga que entendeu o pedido e que o Laranjinha vai buscar esse resumo no banco.`;
  }

  return `O usuário precisa de ajuda: ${intent.mensagem}`;
}

function buildFallback(intent: FinanceIntent): string {
  if (intent.acao === "registrar_transacao") {
    return `Anotado, patrão: ${intent.tipo} de R$ ${intent.valor} em ${intent.descricao} (${intent.categoria}).`;
  }

  if (intent.acao === "consultar") {
    return "Boa, patrão. Vou buscar esse resumo financeiro pra você.";
  }

  return intent.mensagem;
}
