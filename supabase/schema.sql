-- Im Supabase SQL Editor ausführen (Dashboard -> SQL Editor -> New query)

create table if not exists termine (
  id uuid primary key default gen_random_uuid(),
  datum date not null,
  name text not null,
  von_zeit time not null,
  bis_zeit time not null,
  created_at timestamptz not null default now()
);

-- Row Level Security aktivieren, aber allen (anon key) vollen Zugriff geben,
-- damit die App ohne eigenes Backend/Login funktioniert.
alter table termine enable row level security;

create policy "Öffentlicher Zugriff auf Termine"
  on termine
  for all
  using (true)
  with check (true);

-- Damit die App Live-Updates von anderen Geräten empfängt (Realtime):
alter publication supabase_realtime add table termine;
