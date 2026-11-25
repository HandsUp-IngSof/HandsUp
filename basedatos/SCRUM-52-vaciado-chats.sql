-- =====================================================================
-- SCRUM-52 · Eliminación / vaciado automático de chats
-- Requiere haber corrido antes SCRUM-44 (y SCRUM-49 para limpiar avisos).
--
-- Regla: los mensajes de más de 30 días se borran solos todos los días.
-- Así el chat no guarda conversaciones viejas indefinidamente (privacidad
-- y espacio en la base de datos).
--
-- Correr en Supabase > SQL Editor en DOS partes (primero la 1, luego la 2).
-- =====================================================================


-- ============================ PARTE 1 ================================
-- Función que borra los mensajes viejos. Devuelve cuántos borró.
create or replace function public.vaciar_chats_antiguos(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_borrados integer;
begin
  if p_dias is null or p_dias < 1 then
    raise exception 'La cantidad de días debe ser 1 o más.';
  end if;

  delete from public.mensajes m
   where m.creado_en < now() - make_interval(days => p_dias);
  get diagnostics v_borrados = row_count;

  -- También se limpian los avisos de mensajes ya leídos de esa misma antigüedad.
  delete from public.notificaciones n
   where n.tipo = 'mensaje' and n.leida and n.creado_en < now() - make_interval(days => p_dias);

  return v_borrados;
end;
$$;

-- Nadie la puede llamar desde la aplicación: solo la tarea programada (o el SQL Editor).
revoke execute on function public.vaciar_chats_antiguos(integer) from public, anon, authenticated;


-- ============================ PARTE 2 ================================
-- Tarea programada con pg_cron: todos los días a las 3:00 a. m. hora de Colombia (08:00 UTC).
-- Si sale un error de permisos, quien sea Owner del proyecto en Supabase debe activar
-- pg_cron en Database > Extensions y luego correr esta parte otra vez.
create extension if not exists pg_cron;

select cron.schedule(
  'vaciar-chats-antiguos',
  '0 8 * * *',
  $$select public.vaciar_chats_antiguos(30);$$
);
