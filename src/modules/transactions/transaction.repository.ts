import type { CreateTransactionInput, Transaction, TransactionSummary } from "../../types/finance.js";
import { AppError } from "../../shared/errors/app-error.js";
import { supabase } from "../../infra/supabase/supabase.client.js";

export class TransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transacoes")
      .insert(input)
      .select("id,usuario_id,tipo,valor,categoria,descricao,data,created_at")
      .single();

    if (error || !data) {
      throw new AppError("Erro ao salvar transação.", 500, "supabase_transaction_create_error", error);
    }

    return normalizeTransaction(data);
  }

  async listByDateRange(input: {
    userId: string;
    startDate: string;
    endDate: string;
    category?: string;
  }): Promise<Transaction[]> {
    let query = supabase
      .from("transacoes")
      .select("id,usuario_id,tipo,valor,categoria,descricao,data,created_at")
      .eq("usuario_id", input.userId)
      .gte("data", input.startDate)
      .lte("data", input.endDate)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (input.category) {
      query = query.or(`categoria.ilike.%${input.category}%,descricao.ilike.%${input.category}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("Erro ao consultar transações.", 500, "supabase_transaction_query_error", error);
    }

    return (data ?? []).map(normalizeTransaction);
  }

  summarize(transactions: Transaction[]): TransactionSummary {
    return transactions.reduce<TransactionSummary>(
      (summary, transaction) => {
        const value = Number(transaction.valor);

        if (transaction.tipo === "despesa") {
          summary.totalDespesas += value;
          summary.porCategoria[transaction.categoria] =
            (summary.porCategoria[transaction.categoria] ?? 0) + value;
        } else {
          summary.totalReceitas += value;
        }

        summary.saldo = summary.totalReceitas - summary.totalDespesas;
        summary.quantidade += 1;
        summary.transacoes.push(transaction);
        return summary;
      },
      {
        totalDespesas: 0,
        totalReceitas: 0,
        saldo: 0,
        quantidade: 0,
        porCategoria: {},
        transacoes: []
      }
    );
  }
}

function normalizeTransaction(raw: Transaction): Transaction {
  return {
    ...raw,
    valor: Number(raw.valor)
  };
}
