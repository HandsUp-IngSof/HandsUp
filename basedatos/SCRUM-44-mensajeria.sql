-- =====================================================================
-- SCRUM-44 · Mensajería interna tipo chat
-- Correr completo en Supabase > SQL Editor. Se puede volver a correr sin daño.
--
-- Reglas:
--   * Una conversación es entre un docente (profesor) y un estudiante.
--   * Solo pueden abrir una conversación si tienen al menos una clase
--     (reunión) no cancelada entre los dos.
--   * Cada persona solo ve sus propias conversaciones y mensajes.
--   * Un mensaje tiene entre 1 y 1.000 caracteres.
-- =====================================================================

create table if not exists public.conversaciones (
  id            uuid primary key default gen_random_uuid(),
  profesor_id   uuid not null references public.perfiles (id) on delete cascade,
  estudiante_id uuid not null references public.perfiles (id) on delete cascade,
  creado_en     timestamptz not null default now(),
  unique (profesor_id, estudiante_id)
);

create table if not exists public.mensajes (
  id              uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  autor_id        uuid not null references public.perfiles (id) on delete cascade,
  texto           text not null check (char_length(btrim(texto)) between 1 and 1000),
  creado_en       timestamptz not null default now(),
  leido_en        timestamptz
);

create index if not exists mensajes_conversacion_fecha on public.mensajes (conversacion_id, creado_en);

alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;

-- Ver solo mis conversaciones.
drop policy if exists "Ver mis conversaciones" on public.conversaciones;
create policy "Ver mis conversaciones" on public.conversaciones
  for select to authenticated
  using ((select auth.uid()) in (profesor_id, estudiante_id));

-- Ver solo los mensajes de mis conversaciones.
drop policy if exists "Ver mensajes de mis conversaciones" on public.mensajes;
create policy "Ver mensajes de mis conversaciones" on public.mensajes
  for select to authenticated
  using (exists (
    select 1 from public.conversaciones c
    where c.id = conversacion_id and (select auth.uid()) in (c.profesor_id, c.estudiante_id)
  ));

-- Enviar mensajes solo en mis conversaciones y a mi nombre.
drop policy if exists "Enviar mensajes en mis conversaciones" on public.mensajes;
create policy "Enviar mensajes en mis conversaciones" on public.mensajes
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.conversaciones c
      where c.id = conversacion_id and (select auth.uid()) in (c.profesor_id, c.estudiante_id)
    )
  );

-- Las conversaciones no se crean directamente: se crean con abrir_conversacion(),
-- que revisa que haya una clase entre los dos.
create or replace function public.abrir_conversacion(p_otro uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_yo   uuid := auth.uid();
  v_rol  text;
  v_prof uuid;
  v_est  uuid;
  v_id   uuid;
begin
  if v_yo is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select p.rol::text into v_rol from public.perfiles p where p.id = v_yo;
  if v_rol = 'profesor' then
    v_prof := v_yo; v_est := p_otro;
  elsif v_rol = 'estudiante' then
    v_prof := p_otro; v_est := v_yo;
  else
    raise exception 'Tu rol no puede usar el chat.';
  end if;

  select c.id into v_id from public.conversaciones c where c.profesor_id = v_prof and c.estudiante_id = v_est;
  if v_id is not null then
    return v_id;
  end if;

  if not exists (
    select 1 from public.reuniones r
    where r.profesor_id = v_prof and r.estudiante_id = v_est
      and (r.estado is null or r.estado::text <> 'cancelada')
  ) then
    raise exception 'Solo puedes escribirle a personas con las que tienes clases.';
  end if;

  insert into public.conversaciones (profesor_id, estudiante_id)
  values (v_prof, v_est)
  on conflict (profesor_id, estudiante_id) do update set profesor_id = excluded.profesor_id
  returning id into v_id;

  return v_id;
end;
$$;

-- Marca como leídos los mensajes que me enviaron en una conversación.
create or replace function public.marcar_leidos(p_conversacion uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  update public.mensajes m
     set leido_en = now()
   where m.conversacion_id = p_conversacion
     and m.autor_id <> auth.uid()
     and m.leido_en is null
     and exists (
       select 1 from public.conversaciones c
       where c.id = p_conversacion and auth.uid() in (c.profesor_id, c.estudiante_id)
     );
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

-- Lista de chats: todas las personas con las que tengo clases (o ya tengo conversación),
-- con el último mensaje y cuántos no he leído.
create or replace function public.mis_chats()
returns table (
  otro_id uuid, nombre text, apellido text, avatar_url text, rol text,
  conversacion_id uuid, ultimo_texto text, ultimo_autor uuid, ultimo_en timestamptz, sin_leer integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with contactos as (
    select case when r.profesor_id = auth.uid() then r.estudiante_id else r.profesor_id end as otro
    from public.reuniones r
    where auth.uid() in (r.profesor_id, r.estudiante_id)
      and (r.estado is null or r.estado::text <> 'cancelada')
    union
    select case when c.profesor_id = auth.uid() then c.estudiante_id else c.profesor_id end
    from public.conversaciones c
    where auth.uid() in (c.profesor_id, c.estudiante_id)
  )
  select p.id, p.nombre::text, p.apellido::text, p.avatar_url::text, p.rol::text,
         c.id, um.texto, um.autor_id, um.creado_en,
         coalesce((
           select count(*) from public.mensajes m
           where m.conversacion_id = c.id and m.autor_id <> auth.uid() and m.leido_en is null
         ), 0)::integer
  from contactos k
  join public.perfiles p on p.id = k.otro
  left join public.conversaciones c
    on (c.profesor_id = auth.uid() and c.estudiante_id = p.id)
    or (c.estudiante_id = auth.uid() and c.profesor_id = p.id)
  left join lateral (
    select m.texto, m.autor_id, m.creado_en from public.mensajes m
    where m.conversacion_id = c.id order by m.creado_en desc limit 1
  ) um on true
  order by um.creado_en desc nulls last, p.nombre;
$$;

-- Total de mensajes sin leer (para el número del menú "Mensajes").
create or replace function public.mensajes_sin_leer()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.mensajes m
  join public.conversaciones c on c.id = m.conversacion_id
  where auth.uid() in (c.profesor_id, c.estudiante_id)
    and m.autor_id <> auth.uid()
    and m.leido_en is null;
$$;

revoke execute on function public.abrir_conversacion(uuid) from public, anon;
revoke execute on function public.marcar_leidos(uuid) from public, anon;
revoke execute on function public.mis_chats() from public, anon;
revoke execute on function public.mensajes_sin_leer() from public, anon;
grant execute on function public.abrir_conversacion(uuid) to authenticated;
grant execute on function public.marcar_leidos(uuid) to authenticated;
grant execute on function public.mis_chats() to authenticated;
grant execute on function public.mensajes_sin_leer() to authenticated;

-- Tiempo real: los mensajes nuevos llegan sin recargar la página.
-- (Supabase respeta las reglas de arriba: cada quien solo recibe sus mensajes.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end $$;
