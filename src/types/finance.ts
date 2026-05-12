export type TransactionType = "despesa" | "receita";

export type TransactionCategory =
  | "alimentacao"
  | "mercado"
  | "transporte"
  | "moradia"
  | "saude"
  | "educacao"
  | "lazer"
  | "assinaturas"
  | "compras"
  | "servicos"
  | "salario"
  | "freelance"
  | "investimentos"
  | "outros";

export interface User {
  id: string;
  nome: string | null;
  telefone: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  usuario_id: string;
  tipo: TransactionType;
  valor: number;
  categoria: TransactionCategory | string;
  descricao: string;
  data: string;
  created_at: string;
}

export interface CreateTransactionInput {
  usuario_id: string;
  tipo: TransactionType;
  valor: number;
  categoria: TransactionCategory | string;
  descricao: string;
  data: string;
}

export interface TransactionSummary {
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  quantidade: number;
  porCategoria: Record<string, number>;
  transacoes: Transaction[];
}
