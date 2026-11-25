-- =====================================================================
-- SCRUM-49 · Sistema multicanal de notificaciones y alertas
-- Requiere haber corrido antes basedatos/SCRUM-44-mensajeria.sql.
-- Correr completo en Supabase > SQL Editor. Se puede volver a correr sin daño.
--
-- Las notificaciones las crea la base de datos sola (triggers):
--   * Mensaje nuevo  -> avisa a quien lo recibe.
--   * Clase agendada -> avisa a la otra persona de la clase.
--   * Clase cambia de estado (confirmada, cancelada...) -> avisa a la otra persona.
-- Cada persona solo ve, marca como leídas o borra sus propias notificaciones.
-- Los usuarios no pueden crear notificaciones directamente.
-- =====================================================================

create table if not exists public.notificaciones (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  tipo       text not null check (tipo in ('mensaje', 'clase', 'sistema')),
  titulo     text not null,
  texto      text,
  enlace     text,
  leida      boolean not null default false,
  creado_en  timestamptz not null default now()
);

create index if not exists notificaciones_usuario_fecha on public.notificaciones (usuario_id, creado_en desc);

alter table public.notificaciones enable row level security;

drop policy if exists "Ver mis notificaciones" on public.notificaciones;
create policy "Ver mis notificaciones" on public.notificaciones
  for select to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists "Marcar mis notificaciones" on public.notificaciones;
create policy "Marcar mis notificaciones" on public.notificaciones
  for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists "Borrar mis notificaciones" on public.notificaciones;
create policy "Borrar mis notificaciones" on public.notificaciones
  for delete to authenticated using (usuario_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Mensaje nuevo: avisa a quien lo recibe. Si ya tiene un aviso sin leer
-- de ese mismo chat, lo actualiza en vez de crear otro.
-- ---------------------------------------------------------------------
create or replace function public.notificar_mensaje()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profesor   uuid;
  v_estudiante uuid;
  v_receptor   uuid;
  v_rol        text;
  v_autor      text;
  v_enlace     text;
begin
  select c.profesor_id, c.estudiante_id into v_profesor, v_estudiante
  from public.conversaciones c where c.id = new.conversacion_id;

  v_receptor := case when new.autor_id = v_profesor then v_estudiante else v_profesor end;
  select p.rol::text into v_rol from public.perfiles p where p.id = v_receptor;
  select p.nombre::text into v_autor from public.perfiles p where p.id = new.autor_id;

  v_enlace := case when v_rol = 'profesor' then '/docente/mensajes?con=' else '/estudiante/mensajes?con=' end
              || new.autor_id::text;

  update public.notificaciones n
     set texto = left(new.texto, 120), creado_en = now()
   where n.usuario_id = v_receptor and n.tipo = 'mensaje' and n.enlace = v_enlace and not n.leida;

  if not found then
    insert into public.notificaciones (usuario_id, tipo, titulo, texto, enlace)
    values (v_receptor, 'mensaje', 'Nuevo mensaje de ' || coalesce(v_autor, 'tu contacto'), left(new.texto, 120), v_enlace);
  end if;

  return new;
end;
$$;

drop trigger if exists al_enviar_mensaje on public.mensajes;
create trigger al_enviar_mensaje
  after insert on public.mensajes
  for each row execute function public.notificar_mensaje();

-- ---------------------------------------------------------------------
-- Clases: avisa a las dos personas de la clase, menos a quien hizo el cambio.
-- ---------------------------------------------------------------------
create or replace function public.notificar_clase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fecha    text;
  v_est      text;
  v_prof     text;
  v_destino  uuid;
  v_es_prof  boolean;
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return new;
  end if;

  v_fecha := to_char(new.fecha_inicio at time zone 'America/Bogota', 'DD/MM/YYYY HH12:MI AM');
  select p.nombre::text || ' ' || p.apellido::text into v_est from public.perfiles p where p.id = new.estudiante_id;
  select p.nombre::text || ' ' || p.apellido::text into v_prof from public.perfiles p where p.id = new.profesor_id;

  foreach v_destino in array array[new.profesor_id, new.estudiante_id] loop
    continue when v_destino is not distinct from auth.uid(); -- no avisarle a quien hizo el cambio
    v_es_prof := v_destino = new.profesor_id;

    if tg_op = 'INSERT' then
      insert into public.notificaciones (usuario_id, tipo, titulo, texto, enlace)
      values (
        v_destino, 'clase', 'Nueva clase agendada',
        case when v_es_prof then coalesce(v_est, 'Un estudiante') || ' reservó una clase para el ' || v_fecha || '.'
             else 'Tienes una clase con ' || coalesce(v_prof, 'tu docente') || ' el ' || v_fecha || '.' end,
        case when v_es_prof then '/docente/calendario' else '/estudiante/clases' end
      );
    else
      insert into public.notificaciones (usuario_id, tipo, titulo, texto, enlace)
      values (
        v_destino, 'clase',
        case when new.estado::text = 'cancelada' then 'Clase cancelada' else 'Tu clase cambió de estado' end,
        'La clase con ' || coalesce(case when v_es_prof then v_est else v_prof end, 'tu contacto')
          || ' del ' || v_fecha || ' ahora está: ' || coalesce(new.estado::text, 'sin estado') || '.',
        case when v_es_prof then '/docente/calendario' else '/estudiante/clases' end
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists al_cambiar_clase on public.reuniones;
create trigger al_cambiar_clase
  after insert or update of estado on public.reuniones
  for each row execute function public.notificar_clase();

-- Tiempo real: las notificaciones llegan sin recargar la página.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;
