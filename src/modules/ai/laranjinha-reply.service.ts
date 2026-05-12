import { env } from "../../config/env.js";
import { openai } from "../../infra/openai/openai.client.js";
import {
  buildLaranjinhaReplyPrompt,
  laranjinhaReplySystemPrompt
} from "../../prompts/laranjinha-reply.prompt.js";
import { logger } from "../../shared/logger.js";

export class LaranjinhaReplyService {
  async generate(context: string, fallback: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: laranjinhaReplySystemPrompt
          },
          {
            role: "user",
            content: buildLaranjinhaReplyPrompt(context)
          }
        ]
      });

      return completion.choices[0]?.message.content?.trim() || fallback;
    } catch (error) {
      logger.warn({ error }, "Failed to generate Laranjinha reply, using fallback");
      return fallback;
    }
  }
}
