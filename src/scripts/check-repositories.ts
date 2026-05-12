import "dotenv/config";

import { supabase } from "../infra/supabase/supabase.client.js";
import { SubscriptionRepository } from "../modules/subscriptions/subscription.repository.js";
import { TransactionRepository } from "../modules/transactions/transaction.repository.js";
import { UserRepository } from "../modules/users/user.repository.js";
import { todayIsoDate } from "../shared/utils/dates.js";

const userRepository = new UserRepository();
const subscriptionRepository = new SubscriptionRepository();
const transactionRepository = new TransactionRepository();

const phone = `550000${Date.now()}`;
const date = todayIsoDate();
let userId: string | null = null;

try {
  const user = await userRepository.findOrCreate({
    phone,
    name: "Smoke Test Supabase"
  });
  userId = user.id;
  console.log(`OK UserRepository: usuario criado (${user.id})`);

  const subscription = await subscriptionRepository.findLatestByUserId(user.id);

  if (!subscription) {
    throw new Error("SubscriptionRepository did not create/find trial subscription");
  }

  console.log(`OK SubscriptionRepository: assinatura ${subscription.status}/${subscription.plano}`);

  const transaction = await transactionRepository.create({
    usuario_id: user.id,
    tipo: "despesa",
    valor: 1.23,
    categoria: "outros",
    descricao: "smoke test supabase",
    data: date
  });

  console.log(`OK TransactionRepository: transacao criada (${transaction.id})`);

  const transactions = await transactionRepository.listByDateRange({
    userId: user.id,
    startDate: date,
    endDate: date
  });

  if (!transactions.some((item) => item.id === transaction.id)) {
    throw new Error("TransactionRepository did not return the created transaction");
  }

  console.log(`OK TransactionRepository: consulta retornou ${transactions.length} transacao(oes)`);
} finally {
  if (userId) {
    await supabase.from("transacoes").delete().eq("usuario_id", userId);
    await supabase.from("assinaturas").delete().eq("usuario_id", userId);
    await supabase.from("usuarios").delete().eq("id", userId);
    console.log("OK cleanup: dados de smoke test removidos");
  }
}
