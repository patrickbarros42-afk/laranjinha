import type { User } from "../../types/finance.js";
import { AppError } from "../../shared/errors/app-error.js";
import { supabase } from "../../infra/supabase/supabase.client.js";

export class UserRepository {
  async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nome,telefone,created_at")
      .eq("telefone", phone)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar usuário.", 500, "supabase_user_lookup_error", error);
    }

    return data;
  }

  async create(input: { phone: string; name?: string | null }): Promise<User> {
    const { data, error } = await supabase
      .from("usuarios")
      .insert({
        telefone: input.phone,
        nome: input.name ?? null
      })
      .select("id,nome,telefone,created_at")
      .single();

    if (error) {
      throw new AppError("Erro ao criar usuário.", 500, "supabase_user_create_error", error);
    }

    return data;
  }

  async findOrCreate(input: { phone: string; name?: string | null }): Promise<User> {
    const existing = await this.findByPhone(input.phone);

    if (existing) {
      return existing;
    }

    return this.create(input);
  }
}
