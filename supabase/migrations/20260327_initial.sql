create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null,
  headline text not null,
  summary text not null,
  mission text not null,
  image_gradient text not null,
  featured boolean not null default false,
  tags text[] not null default '{}',
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  selected_charity_id uuid references public.charities(id) on delete set null,
  charity_percentage integer not null default 10 check (charity_percentage between 10 and 80),
  avatar_seed text not null default 'member',
  stripe_customer_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'inactive', 'canceled', 'past_due')),
  provider text not null check (provider in ('stripe', 'admin')),
  amount_cents integer not null,
  started_at date not null,
  renewal_date date not null,
  canceled_at date,
  stripe_subscription_id text unique,
  stripe_price_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  value integer not null check (value between 1 and 45),
  played_at date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month_key text not null,
  label text not null,
  mode text not null check (mode in ('random', 'hot', 'cold')),
  status text not null check (status in ('draft', 'simulated', 'published')),
  winning_numbers integer[] not null default '{}',
  active_subscriber_count integer not null default 0,
  prize_pool_cents integer not null default 0,
  rollover_cents integer not null default 0,
  winners jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.winner_claims (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_id uuid not null unique,
  proof_path text not null,
  file_name text not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'processing', 'paid', 'rejected')),
  notes text not null default 'Awaiting admin review.',
  submitted_at timestamptz not null default timezone('utc', now()),
  unique (draw_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('signup', 'subscription', 'draw', 'winner', 'proof')),
  channel text not null check (channel in ('email', 'system')),
  subject text not null,
  preview text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'sent' check (status in ('sent', 'skipped')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  detail text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scores_user_id_played_at_idx on public.scores (user_id, played_at desc, created_at desc);
create index if not exists draws_status_created_at_idx on public.draws (status, created_at desc);
create index if not exists winner_claims_user_id_submitted_at_idx on public.winner_claims (user_id, submitted_at desc);
create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.charities enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.winner_claims enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy if not exists "public can read charities"
  on public.charities for select
  using (true);

create policy if not exists "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy if not exists "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy if not exists "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

create policy if not exists "users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

create policy if not exists "admins manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "users manage own scores"
  on public.scores for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy if not exists "public can read published draws"
  on public.draws for select
  using (status = 'published' or public.is_admin());

create policy if not exists "admins manage draws"
  on public.draws for all
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "users manage own claims"
  on public.winner_claims for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy if not exists "users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

create policy if not exists "admins manage notifications"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "admins read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy if not exists "admins manage audit logs"
  on public.audit_logs for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', false)
on conflict (id) do nothing;

insert into public.charities (
  id,
  slug,
  name,
  location,
  headline,
  summary,
  mission,
  image_gradient,
  featured,
  tags,
  events
)
values
  (
    '9f8b37f8-0de4-4328-b95d-f04f3a4f5f31',
    'river-reset',
    'River Reset',
    'Austin, Texas',
    'Restoring urban waterways through youth-led cleanups.',
    'River Reset funds cleanup crews, school workshops, and weekend restoration projects around city water systems.',
    'The charity turns every member contribution into visible, local environmental action with volunteer programs and educational events.',
    'from-emerald-400 via-teal-500 to-cyan-600',
    true,
    array['Environment', 'Youth', 'Community'],
    '[{"id":"river-event-1","title":"Spring Charity Scramble","location":"Barton Creek","date":"2026-04-19"}]'::jsonb
  ),
  (
    '9d7b0f98-d8c0-4a0e-a233-262d6ba4fd58',
    'caddie-futures',
    'Caddie Futures',
    'Scottsdale, Arizona',
    'Opening pathways into sport, study, and leadership.',
    'Caddie Futures supports scholarships, mentorship, and equipment access for underrepresented young golfers.',
    'The organization helps talented young players gain confidence, experience, and better opportunities on and off the course.',
    'from-amber-400 via-orange-500 to-rose-500',
    true,
    array['Education', 'Sport', 'Mentorship'],
    '[{"id":"caddie-event-1","title":"Scholarship Invitational","location":"Troon North","date":"2026-05-04"}]'::jsonb
  ),
  (
    '0c4d8079-24b1-4a48-96ec-1a5d25b45b42',
    'hearts-on-course',
    'Hearts on Course',
    'St Andrews, Scotland',
    'Creating calm, outdoor moments for families facing illness.',
    'Hearts on Course helps families access respite retreats, counseling, and supportive community experiences.',
    'By pairing fundraising with meaningful storytelling, the charity creates tangible emotional support for households under pressure.',
    'from-fuchsia-500 via-pink-500 to-orange-400',
    true,
    array['Health', 'Families', 'Wellbeing'],
    '[{"id":"heart-event-1","title":"Evening Impact Dinner","location":"Old Course Hotel","date":"2026-06-12"}]'::jsonb
  )
on conflict (id) do nothing;
