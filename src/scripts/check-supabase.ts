import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseEnvSchema = z.object({
  SUPABASE_URL: z
    .string()
    .url()
    .refine((url) => !url.includes("/rest/v1"), "Use the Supabase project root URL without /rest/v1"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

const env = supabaseEnvSchema.parse(process.env);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const tables = ["usuarios", "transacoes", "assinaturas"] as const;

for (const table of tables) {
  const { count, error } = await supabase.from(table).select("id", {
    count: "exact",
    head: true
  });

  if (error) {
    throw new Error(`Supabase check failed for table "${table}": ${error.message}`);
  }

  console.log(`OK ${table}: ${count ?? 0} rows visible with service role`);
}

console.log(`Supabase connection OK: ${env.SUPABASE_URL}`);
