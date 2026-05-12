import type { Subscription } from "../../types/finance.js";
import { AppError } from "../../shared/errors/app-error.js";
import { supabase } from "../../infra/supabase/supabase.client.js";

export class SubscriptionRepository {
  async findLatestByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("assinaturas")
      .select("id,usuario_id,status,plano,created_at")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar assinatura.", 500, "supabase_subscription_lookup_error", error);
    }

    return data;
  }

  async createTrial(userId: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from("assinaturas")
      .insert({
        usuario_id: userId,
        status: "trial",
        plano: "mvp"
      })
      .select("id,usuario_id,status,plano,created_at")
      .single();

    if (error) {
      throw new AppError("Erro ao criar assinatura.", 500, "supabase_subscription_create_error", error);
    }

    return data;
  }

  async ensureTrialForUser(userId: string): Promise<Subscription> {
    const existing = await this.findLatestByUserId(userId);

    if (existing) {
      return existing;
    }

    return this.createTrial(userId);
  }
}
