import { z } from "zod";

import { env } from "../../config/env.js";
import { openai } from "../../infra/openai/openai.client.js";
import {
  buildFinanceInterpreterUserPrompt,
  financeInterpreterSystemPrompt
} from "../../prompts/finance-interpreter.prompt.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { FinanceIntent } from "./finance-interpreter.types.js";

const financeIntentSchema = z.discriminatedUnion("acao", [
  z.object({
    acao: z.literal("registrar_transacao"),
    tipo: z.enum(["despesa", "receita"]),
    valor: z.number().positive(),
    categoria: z.enum([
      "alimentacao",
      "mercado",
      "transporte",
      "moradia",
      "saude",
      "educacao",
      "lazer",
      "assinaturas",
      "compras",
      "servicos",
      "salario",
      "freelance",
      "investimentos",
      "outros"
    ]),
    descricao: z.string().min(1).max(120),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    confianca: z.number().min(0).max(1)
  }),
  z.object({
    acao: z.literal("consultar"),
    consulta: z.enum(["gastos_dia", "gastos_mes", "gastos_categoria", "resumo_semana", "resumo_mes"]),
    categoria: z.string().min(1).max(80).nullable(),
    data_ref: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  z.object({
    acao: z.literal("ajuda"),
    mensagem: z.string().min(1).max(240)
  })
]);

const rawFinanceIntentSchema = z.object({
  acao: z.enum(["registrar_transacao", "consultar", "ajuda"]),
  tipo: z.enum(["despesa", "receita"]).nullable(),
  valor: z.number().positive().nullable(),
  categoria: z.string().min(1).max(80).nullable(),
  descricao: z.string().min(1).max(120).nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  confianca: z.number().min(0).max(1).nullable(),
  consulta: z.enum(["gastos_dia", "gastos_mes", "gastos_categoria", "resumo_semana", "resumo_mes"]).nullable(),
  data_ref: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  mensagem: z.string().min(1).max(240).nullable()
});

const responseJsonSchema = {
  name: "finance_intent",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      acao: { enum: ["registrar_transacao", "consultar", "ajuda"] },
      tipo: { type: ["string", "null"], enum: ["despesa", "receita", null] },
      valor: { type: ["number", "null"], exclusiveMinimum: 0 },
      categoria: { type: ["string", "null"] },
      descricao: { type: ["string", "null"] },
      data: { type: ["string", "null"] },
      confianca: { type: ["number", "null"], minimum: 0, maximum: 1 },
      consulta: {
        type: ["string", "null"],
        enum: ["gastos_dia", "gastos_mes", "gastos_categoria", "resumo_semana", "resumo_mes", null]
      },
      data_ref: { type: ["string", "null"] },
      mensagem: { type: ["string", "null"] }
    },
    required: [
      "acao",
      "tipo",
      "valor",
      "categoria",
      "descricao",
      "data",
      "confianca",
      "consulta",
      "data_ref",
      "mensagem"
    ]
  }
} as const;

export class FinanceInterpreterService {
  async interpret(input: { text: string; currentDate: string; userPhone: string }): Promise<FinanceIntent> {
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: responseJsonSchema
      },
      messages: [
        {
          role: "system",
          content: financeInterpreterSystemPrompt
        },
        {
          role: "user",
          content: buildFinanceInterpreterUserPrompt(input)
        }
      ]
    });

    const content = completion.choices[0]?.message.content;

    if (!content) {
      throw new AppError("A IA não retornou uma interpretação.", 502, "openai_empty_interpretation");
    }

    const parsedJson = rawFinanceIntentSchema.parse(JSON.parse(content) as unknown);
    const parsedIntent = financeIntentSchema.safeParse(compactIntent(parsedJson));

    if (!parsedIntent.success) {
      throw new AppError(
        "A IA retornou uma interpretação inválida.",
        502,
        "openai_invalid_interpretation",
        parsedIntent.error.issues
      );
    }

    return parsedIntent.data;
  }
}

function compactIntent(raw: z.infer<typeof rawFinanceIntentSchema>): unknown {
  if (raw.acao === "registrar_transacao") {
    return {
      acao: raw.acao,
      tipo: raw.tipo,
      valor: raw.valor,
      categoria: raw.categoria,
      descricao: raw.descricao,
      data: raw.data,
      confianca: raw.confianca
    };
  }

  if (raw.acao === "consultar") {
    return {
      acao: raw.acao,
      consulta: raw.consulta,
      categoria: raw.categoria,
      data_ref: raw.data_ref
    };
  }

  return {
    acao: raw.acao,
    mensagem: raw.mensagem
  };
}
