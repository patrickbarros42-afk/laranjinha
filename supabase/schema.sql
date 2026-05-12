create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text,
  telefone text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('despesa', 'receita')),
  valor numeric(12, 2) not null check (valor > 0),
  categoria text not null,
  descricao text not null,
  data date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'canceled')),
  plano text not null default 'mvp',
  created_at timestamptz not null default now()
);

create index if not exists usuarios_telefone_idx
  on public.usuarios (telefone);

create index if not exists transacoes_usuario_data_idx
  on public.transacoes (usuario_id, data desc);

create index if not exists transacoes_usuario_categoria_idx
  on public.transacoes (usuario_id, categoria);

create index if not exists assinaturas_usuario_status_idx
  on public.assinaturas (usuario_id, status);

alter table public.usuarios enable row level security;
alter table public.transacoes enable row level security;
alter table public.assinaturas enable row level security;

-- O backend usa SUPABASE_SERVICE_ROLE_KEY no servidor. Esta policy bloqueia acesso anon/auth direto por padrão.
create policy "service role manages usuarios"
  on public.usuarios
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role manages transacoes"
  on public.transacoes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role manages assinaturas"
  on public.assinaturas
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
