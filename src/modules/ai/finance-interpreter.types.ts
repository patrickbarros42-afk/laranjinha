import type { TransactionCategory, TransactionType } from "../../types/finance.js";

export type FinanceIntent =
  | RegisterTransactionIntent
  | QueryFinanceIntent
  | HelpIntent;

export interface RegisterTransactionIntent {
  acao: "registrar_transacao";
  tipo: TransactionType;
  valor: number;
  categoria: TransactionCategory;
  descricao: string;
  data: string;
  confianca: number;
}

export interface QueryFinanceIntent {
  acao: "consultar";
  consulta: "gastos_dia" | "gastos_mes" | "gastos_categoria" | "resumo_semana" | "resumo_mes";
  categoria: string | null;
  data_ref: string;
}

export interface HelpIntent {
  acao: "ajuda";
  mensagem: string;
}
