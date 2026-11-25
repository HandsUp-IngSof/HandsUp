-- =====================================================================
-- SCRUM-37 · Bloqueo y desbloqueo secuencial de contenido
-- Requiere las tablas modulos, lecciones y progreso_lecciones (script de SCRUM-33).
-- Correr completo en Supabase > SQL Editor. Se puede volver a correr sin daño.
--
-- Reglas (las mismas que muestra la app en src/paginas/estudiante/modelo.ts):
--   * Dentro de un módulo, las lecciones van en orden (ya lo valida completar_leccion).
--   * Entre módulos: un módulo (que no sea en vivo) se desbloquea cuando el estudiante
--     termina todas las lecciones publicadas de los módulos anteriores.
--   * Los módulos en vivo se siguen abriendo con la clase de bienvenida.
--   * Si el estudiante ya había empezado un módulo, no se le bloquea lo que ya tenía.
-- =====================================================================

create or replace function public.validar_orden_de_modulos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_modulo    uuid;
  v_orden     integer;
  v_vivo      boolean;
  v_pendiente text;
begin
  if new.completada is not true then
    return new;
  end if;

  select m.id, m.orden, m.requiere_clase_bienvenida into v_modulo, v_orden, v_vivo
  from public.lecciones l join public.modulos m on m.id = l.modulo_id
  where l.id = new.leccion_id;

  if v_modulo is null or v_vivo then
    return new;
  end if;

  -- Ya tenía avance en este módulo: se respeta.
  if exists (
    select 1 from public.progreso_lecciones p join public.lecciones l2 on l2.id = p.leccion_id
    where p.estudiante_id = new.estudiante_id and p.completada
      and l2.modulo_id = v_modulo and p.leccion_id <> new.leccion_id
  ) then
    return new;
  end if;

  -- Primer módulo anterior (publicado, no en vivo) que todavía tiene lecciones sin completar.
  select m2.titulo into v_pendiente
  from public.modulos m2
  where m2.esta_habilitado
    and not m2.requiere_clase_bienvenida
    and m2.orden < v_orden
    and exists (
      select 1 from public.lecciones l3
      where l3.modulo_id = m2.id and l3.esta_habilitada
        and not exists (
          select 1 from public.progreso_lecciones p3
          where p3.leccion_id = l3.id and p3.estudiante_id = new.estudiante_id and p3.completada
        )
    )
  order by m2.orden
  limit 1;

  if v_pendiente is not null then
    raise exception 'Primero completa el módulo "%".', v_pendiente;
  end if;

  return new;
end;
$$;

drop trigger if exists antes_de_completar_por_modulo on public.progreso_lecciones;
create trigger antes_de_completar_por_modulo
  before insert or update on public.progreso_lecciones
  for each row execute function public.validar_orden_de_modulos();
