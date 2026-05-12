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

const responseJsonSchema = {
  name: "finance_intent",
  strict: true,
  schema: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          acao: { const: "registrar_transacao" },
          tipo: { enum: ["despesa", "receita"] },
          valor: { type: "number", exclusiveMinimum: 0 },
          categoria: {
            enum: [
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
            ]
          },
          descricao: { type: "string" },
          data: { type: "string" },
          confianca: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["acao", "tipo", "valor", "categoria", "descricao", "data", "confianca"]
      },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          acao: { const: "consultar" },
          consulta: {
            enum: ["gastos_dia", "gastos_mes", "gastos_categoria", "resumo_semana", "resumo_mes"]
          },
          categoria: {
            anyOf: [{ type: "string" }, { type: "null" }]
          },
          data_ref: { type: "string" }
        },
        required: ["acao", "consulta", "categoria", "data_ref"]
      },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          acao: { const: "ajuda" },
          mensagem: { type: "string" }
        },
        required: ["acao", "mensagem"]
      }
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

    const parsedJson = JSON.parse(content) as unknown;
    const parsedIntent = financeIntentSchema.safeParse(parsedJson);

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
