-- =====================================================================
-- SCRUM-39 · Agendamiento de clases: confirmar o rechazar y evitar reservas dobles
-- Completa lo que ya hace el estudiante (agendar_clase y cancelar_clase, script de SCRUM-33).
-- Correr completo en Supabase > SQL Editor. Se puede volver a correr sin daño.
--
--   * El docente confirma o rechaza las clases "pendientes" de sus estudiantes.
--     Al cambiar el estado, el estudiante recibe la notificación (trigger de SCRUM-49).
--   * Un horario no puede tener dos clases activas (no canceladas) al mismo tiempo,
--     aunque dos estudiantes intenten reservarlo a la vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Evitar reservas dobles
-- ---------------------------------------------------------------------
create or replace function public.evitar_doble_reserva()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.horario_id is null or coalesce(new.estado::text, '') = 'cancelada' then
    return new;
  end if;

  -- Bloquea el horario mientras se revisa: si dos personas reservan a la vez, la segunda espera.
  perform 1 from public.horarios_disponibles h where h.id = new.horario_id for update;

  if exists (
    select 1 from public.reuniones r
    where r.horario_id = new.horario_id
      and r.id <> new.id
      and (r.estado is null or r.estado::text <> 'cancelada')
  ) then
    raise exception 'Este horario ya fue reservado. Elige otro.';
  end if;

  return new;
end;
$$;

drop trigger if exists antes_de_reservar on public.reuniones;
create trigger antes_de_reservar
  before insert or update of horario_id, estado on public.reuniones
  for each row execute function public.evitar_doble_reserva();

-- ---------------------------------------------------------------------
-- 2. El docente confirma o rechaza una reserva pendiente
-- ---------------------------------------------------------------------
create or replace function public.responder_reserva(p_reunion_id uuid, p_confirmar boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profesor uuid;
  v_estado   text;
  v_inicio   timestamptz;
  v_horario  uuid;
begin
  select r.profesor_id, r.estado::text, r.fecha_inicio, r.horario_id
    into v_profesor, v_estado, v_inicio, v_horario
  from public.reuniones r
  where r.id = p_reunion_id;

  if v_profesor is null or v_profesor <> auth.uid() then
    raise exception 'Solo el docente de la clase puede responder esta reserva.';
  end if;
  if v_estado is distinct from 'pendiente' then
    raise exception 'Esta clase ya no está por confirmar.';
  end if;
  if v_inicio < now() then
    raise exception 'La clase ya empezó o ya pasó; no se puede confirmar ni rechazar.';
  end if;

  if p_confirmar then
    update public.reuniones set estado = 'confirmada' where id = p_reunion_id;
    return 'confirmada';
  end if;

  update public.reuniones set estado = 'cancelada' where id = p_reunion_id;
  -- Al rechazarla, el horario vuelve a quedar libre para otros estudiantes.
  if v_horario is not null then
    update public.horarios_disponibles set esta_disponible = true where id = v_horario;
  end if;
  return 'cancelada';
end;
$$;

revoke execute on function public.responder_reserva(uuid, boolean) from public, anon;
grant execute on function public.responder_reserva(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 3. (Solo para revisar) ¿Hay horarios que ya tenían dos clases activas?
--    Si sale alguna fila, cancela a mano una de las dos clases repetidas.
-- ---------------------------------------------------------------------
select r.horario_id, count(*) as clases_activas
from public.reuniones r
where r.horario_id is not null and (r.estado is null or r.estado::text <> 'cancelada')
group by r.horario_id
having count(*) > 1;
