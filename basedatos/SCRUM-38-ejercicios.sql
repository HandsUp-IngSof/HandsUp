-- =====================================================================
-- SCRUM-38 · Calificador automático de ejercicios interactivos
-- Requiere las tablas modulos y lecciones (script del panel del estudiante de SCRUM-33).
-- Correr completo en Supabase > SQL Editor. Se puede volver a correr sin daño.
--
-- Cómo funciona:
--   * El docente crea los ejercicios de cada lección desde "Mis módulos":
--     una pregunta con 2 a 4 opciones y una correcta.
--   * El estudiante responde y Supabase califica (la respuesta correcta
--     nunca viaja al navegador del estudiante antes de calificar).
--   * Con 70 % o más aprueba; si la lección tiene ejercicios, no se puede
--     marcar como completada sin aprobarlos.
-- =====================================================================

create table if not exists public.ejercicios (
  id                 uuid primary key default gen_random_uuid(),
  leccion_id         uuid not null references public.lecciones (id) on delete cascade,
  pregunta           text not null check (char_length(btrim(pregunta)) between 3 and 300),
  opciones           text[] not null check (array_length(opciones, 1) between 2 and 4),
  respuesta_correcta smallint not null,
  orden              integer not null default 0,
  creado_en          timestamptz not null default now(),
  check (respuesta_correcta >= 0 and respuesta_correcta < array_length(opciones, 1))
);

create index if not exists ejercicios_leccion on public.ejercicios (leccion_id, orden);

create table if not exists public.intentos_leccion (
  id            uuid primary key default gen_random_uuid(),
  leccion_id    uuid not null references public.lecciones (id) on delete cascade,
  estudiante_id uuid not null references public.perfiles (id) on delete cascade,
  correctas     integer not null,
  total         integer not null,
  puntaje       integer not null,
  aprobado      boolean not null,
  creado_en     timestamptz not null default now()
);

create index if not exists intentos_estudiante_leccion on public.intentos_leccion (estudiante_id, leccion_id);

alter table public.ejercicios enable row level security;
alter table public.intentos_leccion enable row level security;

-- El docente dueño de la lección crea, ve, cambia y borra sus ejercicios.
-- Los estudiantes NO leen esta tabla (ahí está la respuesta correcta): usan ejercicios_de_leccion().
drop policy if exists "Docente gestiona los ejercicios de sus lecciones" on public.ejercicios;
create policy "Docente gestiona los ejercicios de sus lecciones" on public.ejercicios
  for all to authenticated
  using (exists (
    select 1 from public.lecciones l where l.id = leccion_id and l.profesor_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lecciones l where l.id = leccion_id and l.profesor_id = (select auth.uid())
  ));

-- Cada estudiante ve sus intentos; el docente ve los intentos de sus lecciones.
drop policy if exists "Ver intentos propios o de mis lecciones" on public.intentos_leccion;
create policy "Ver intentos propios o de mis lecciones" on public.intentos_leccion
  for select to authenticated
  using (
    estudiante_id = (select auth.uid())
    or exists (select 1 from public.lecciones l where l.id = leccion_id and l.profesor_id = (select auth.uid()))
  );

-- Preguntas de una lección publicada, SIN la respuesta correcta (para el estudiante).
create or replace function public.ejercicios_de_leccion(p_leccion_id uuid)
returns table (id uuid, pregunta text, opciones text[], orden integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.pregunta, e.opciones, e.orden
  from public.ejercicios e
  join public.lecciones l on l.id = e.leccion_id
  join public.modulos m on m.id = l.modulo_id
  where e.leccion_id = p_leccion_id
    and l.esta_habilitada and m.esta_habilitado
    and auth.uid() is not null
  order by e.orden, e.creado_en;
$$;

-- Califica las respuestas del estudiante. p_respuestas = {"<id del ejercicio>": <indice de la opción>, ...}
-- Guarda el intento y devuelve la nota. La respuesta correcta solo se revela si aprobó.
create or replace function public.calificar_leccion(p_leccion_id uuid, p_respuestas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_yo        uuid := auth.uid();
  v_total     integer := 0;
  v_correctas integer := 0;
  v_puntaje   integer;
  v_aprobado  boolean;
  v_detalle   jsonb := '[]'::jsonb;
  v_resp      integer;
  r           record;
begin
  if v_yo is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if not exists (select 1 from public.perfiles p where p.id = v_yo and p.rol::text = 'estudiante') then
    raise exception 'Solo los estudiantes resuelven los ejercicios.';
  end if;
  if not exists (
    select 1 from public.lecciones l join public.modulos m on m.id = l.modulo_id
    where l.id = p_leccion_id and l.esta_habilitada and m.esta_habilitado
  ) then
    raise exception 'Esta lección no está disponible.';
  end if;

  for r in
    select e.id, e.respuesta_correcta from public.ejercicios e
    where e.leccion_id = p_leccion_id order by e.orden, e.creado_en
  loop
    v_total := v_total + 1;
    v_resp := case when jsonb_typeof(p_respuestas -> r.id::text) = 'number'
                   then (p_respuestas ->> r.id::text)::integer end;
    if v_resp = r.respuesta_correcta then
      v_correctas := v_correctas + 1;
    end if;
    v_detalle := v_detalle || jsonb_build_object(
      'ejercicio_id', r.id,
      'correcta', coalesce(v_resp = r.respuesta_correcta, false),
      'respuesta_correcta', r.respuesta_correcta
    );
  end loop;

  if v_total = 0 then
    raise exception 'Esta lección no tiene ejercicios.';
  end if;

  v_puntaje := round(v_correctas * 100.0 / v_total);
  v_aprobado := v_puntaje >= 70;

  insert into public.intentos_leccion (leccion_id, estudiante_id, correctas, total, puntaje, aprobado)
  values (p_leccion_id, v_yo, v_correctas, v_total, v_puntaje, v_aprobado);

  -- Si no aprobó, no se revela cuál era la opción correcta (solo si acertó o no).
  if not v_aprobado then
    select coalesce(jsonb_agg(d - 'respuesta_correcta'), '[]'::jsonb) into v_detalle
    from jsonb_array_elements(v_detalle) d;
  end if;

  return jsonb_build_object(
    'correctas', v_correctas, 'total', v_total, 'puntaje', v_puntaje,
    'aprobado', v_aprobado, 'minimo', 70, 'detalle', v_detalle
  );
end;
$$;

-- Una lección con ejercicios solo se puede completar si el estudiante ya los aprobó.
-- (Funciona junto con completar_leccion, que ya revisa el orden de las lecciones.)
create or replace function public.validar_ejercicios_aprobados()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.completada is true
     and exists (select 1 from public.ejercicios e where e.leccion_id = new.leccion_id)
     and not exists (
       select 1 from public.intentos_leccion i
       where i.leccion_id = new.leccion_id and i.estudiante_id = new.estudiante_id and i.aprobado
     )
  then
    raise exception 'Para completar esta lección debes aprobar sus ejercicios (mínimo 70%%).';
  end if;
  return new;
end;
$$;

drop trigger if exists antes_de_completar_leccion on public.progreso_lecciones;
create trigger antes_de_completar_leccion
  before insert or update on public.progreso_lecciones
  for each row execute function public.validar_ejercicios_aprobados();

revoke execute on function public.ejercicios_de_leccion(uuid) from public, anon;
revoke execute on function public.calificar_leccion(uuid, jsonb) from public, anon;
grant execute on function public.ejercicios_de_leccion(uuid) to authenticated;
grant execute on function public.calificar_leccion(uuid, jsonb) to authenticated;
