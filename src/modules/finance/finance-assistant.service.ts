import { AudioTranscriptionService } from "../ai/audio-transcription.service.js";
import { FinanceInterpreterService } from "../ai/finance-interpreter.service.js";
import type { FinanceIntent, QueryFinanceIntent, RegisterTransactionIntent } from "../ai/finance-interpreter.types.js";
import { LaranjinhaReplyService } from "../ai/laranjinha-reply.service.js";
import { TransactionRepository } from "../transactions/transaction.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, todayIsoDate } from "../../shared/utils/dates.js";
import { formatMoney } from "../../shared/utils/money.js";
import type { TransactionSummary } from "../../types/finance.js";
import type { NormalizedWhatsAppMessage } from "../../types/whatsapp.js";

export class FinanceAssistantService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly transactions = new TransactionRepository(),
    private readonly interpreter = new FinanceInterpreterService(),
    private readonly replies = new LaranjinhaReplyService(),
    private readonly transcription = new AudioTranscriptionService(),
    private readonly whatsapp = new WhatsAppService()
  ) {}

  async handleIncomingMessage(message: NormalizedWhatsAppMessage): Promise<void> {
    await this.whatsapp.markAsRead(message.messageId);

    const user = await this.users.findOrCreate({
      phone: message.from,
      name: message.contactName
    });

    if (message.type === "image") {
      await this.whatsapp.sendText(
        message.from,
        "Vi sua nota fiscal aqui 👀 O OCR está preparado para entrar, mas no MVP me manda o valor em texto ou áudio que eu anoto certinho."
      );
      return;
    }

    const text = await this.extractText(message);

    if (!text) {
      await this.whatsapp.sendText(
        message.from,
        "Me manda tipo: \"gastei 18 reais na padaria\" ou \"quanto gastei esse mês?\" que eu resolvo 😅"
      );
      return;
    }

    const intent = await this.interpreter.interpret({
      text,
      currentDate: todayIsoDate(),
      userPhone: message.from
    });

    const response = await this.executeIntent(intent, user.id);
    await this.whatsapp.sendText(message.from, response);
  }

  private async extractText(message: NormalizedWhatsAppMessage): Promise<string | null> {
    if (message.type === "text" || message.type === "button") {
      return message.text?.trim() || null;
    }

    if (message.type === "audio" && message.mediaId) {
      const media = await this.whatsapp.downloadMedia(message.mediaId);
      return this.transcription.transcribe(media);
    }

    return null;
  }

  private async executeIntent(intent: FinanceIntent, userId: string): Promise<string> {
    if (intent.acao === "registrar_transacao") {
      return this.registerTransaction(intent, userId);
    }

    if (intent.acao === "consultar") {
      return this.answerQuery(intent, userId);
    }

    return this.replies.generate(
      `O usuário precisa de ajuda. Mensagem base: ${intent.mensagem}`,
      `${intent.mensagem} Me manda um gasto, receita ou pergunta de resumo que eu organizo aqui 🍊`
    );
  }

  private async registerTransaction(intent: RegisterTransactionIntent, userId: string): Promise<string> {
    const transaction = await this.transactions.create({
      usuario_id: userId,
      tipo: intent.tipo,
      valor: intent.valor,
      categoria: intent.categoria,
      descricao: intent.descricao,
      data: intent.data
    });

    const action = transaction.tipo === "despesa" ? "despesa anotada" : "receita anotada";
    const fallback =
      `Anotado, patrão 😅 ${capitalize(action)}: ${formatMoney(transaction.valor)} em ` +
      `${transaction.descricao} (${transaction.categoria}) no dia ${transaction.data}.`;

    return this.replies.generate(
      `${action}: ${formatMoney(transaction.valor)}, categoria ${transaction.categoria}, descricao ${transaction.descricao}, data ${transaction.data}.`,
      fallback
    );
  }

  private async answerQuery(intent: QueryFinanceIntent, userId: string): Promise<string> {
    const range = this.resolveQueryRange(intent);
    const transactions = await this.transactions.listByDateRange({
      userId,
      startDate: range.startDate,
      endDate: range.endDate,
      category: intent.consulta === "gastos_categoria" ? intent.categoria ?? undefined : undefined
    });
    const summary = this.transactions.summarize(transactions);
    const fallback = this.buildSummaryFallback(intent, summary, range.label);

    return this.replies.generate(
      `${range.label}: despesas ${formatMoney(summary.totalDespesas)}, receitas ${formatMoney(summary.totalReceitas)}, saldo ${formatMoney(summary.saldo)}, quantidade ${summary.quantidade}, categorias ${JSON.stringify(summary.porCategoria)}.`,
      fallback
    );
  }

  private resolveQueryRange(intent: QueryFinanceIntent): { startDate: string; endDate: string; label: string } {
    if (intent.consulta === "gastos_dia") {
      return {
        startDate: intent.data_ref,
        endDate: intent.data_ref,
        label: "hoje"
      };
    }

    if (intent.consulta === "resumo_semana") {
      return {
        startDate: startOfWeek(intent.data_ref),
        endDate: endOfWeek(intent.data_ref),
        label: "resumo da semana"
      };
    }

    const monthRange = {
      startDate: startOfMonth(intent.data_ref),
      endDate: endOfMonth(intent.data_ref)
    };

    if (intent.consulta === "gastos_categoria") {
      return {
        ...monthRange,
        label: `gastos com ${intent.categoria ?? "essa categoria"} no mês`
      };
    }

    return {
      ...monthRange,
      label: intent.consulta === "resumo_mes" ? "resumo do mês" : "este mês"
    };
  }

  private buildSummaryFallback(intent: QueryFinanceIntent, summary: TransactionSummary, label: string): string {
    if (summary.quantidade === 0) {
      return `Não achei nada para ${label}. Carteira quietinha por aqui 🍊`;
    }

    const topCategory = Object.entries(summary.porCategoria).sort((a, b) => b[1] - a[1])[0];
    const categoryText = topCategory ? ` Maior categoria: ${topCategory[0]} (${formatMoney(topCategory[1])}).` : "";

    if (intent.consulta === "gastos_dia" || intent.consulta === "gastos_mes" || intent.consulta === "gastos_categoria") {
      return `Você gastou ${formatMoney(summary.totalDespesas)} em ${label}.${categoryText} Tô de olho hein 👀`;
    }

    return (
      `${capitalize(label)}: ${formatMoney(summary.totalDespesas)} em despesas, ` +
      `${formatMoney(summary.totalReceitas)} em receitas e saldo de ${formatMoney(summary.saldo)}.${categoryText}`
    );
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
