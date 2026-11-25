-- =====================================================================
-- handsUp · Script de DATOS DE PRUEBA
-- Correr en Supabase > SQL Editor DESPUÉS de basedatos/creacion-de-tablas.sql.
-- Se puede volver a correr sin duplicar datos (revisa lo que ya existe).
--
-- Crea:
--   * 13 cuentas (2 docentes y 11 estudiantes) con contraseña cifrada con bcrypt.
--       Docentes:    docente@handsup.com (Laura), carlos@handsup.com  -> Docente2026
--       Estudiantes: estudiante@handsup.com (Valentina) y 10 más      -> Estudiante2026
--     El trigger handle_new_user crea el perfil de cada cuenta con su rol.
--   * 10 lecciones agrupadas en el "Módulo inicial" (8 publicadas).
--   * Horarios de Laura y Carlos (2 semanas atrás y 3 adelante) con clases
--     completadas, confirmadas, pendientes y canceladas.
--   * Progreso de cada estudiante en las lecciones.
--   * Datos de perfil (bio, enlace de clase, celular) y 2 ejercicios de ejemplo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Cuentas de prueba (Supabase Auth)
-- ---------------------------------------------------------------------
do $$
declare
  u record;
  nuevo_id uuid;
begin
  for u in
    select * from (values
      ('docente@handsup.com',    'Docente2026',    'Laura',      'Martinez', 'profesor'),
      ('carlos@handsup.com',     'Docente2026',    'Carlos',     'Rios',     'profesor'),
      ('estudiante@handsup.com', 'Estudiante2026', 'Valentina',  'Gomez',    'estudiante'),
      ('sofia@handsup.com',      'Estudiante2026', 'Sofia',      'Ramirez',  'estudiante'),
      ('andres@handsup.com',     'Estudiante2026', 'Andres',     'Torres',   'estudiante'),
      ('mateo@handsup.com',      'Estudiante2026', 'Mateo',      'Rojas',    'estudiante'),
      ('isabella@handsup.com',   'Estudiante2026', 'Isabella',   'Castro',   'estudiante'),
      ('samuel@handsup.com',     'Estudiante2026', 'Samuel',     'Herrera',  'estudiante'),
      ('mariana@handsup.com',    'Estudiante2026', 'Mariana',    'Lopez',    'estudiante'),
      ('juanpablo@handsup.com',  'Estudiante2026', 'Juan Pablo', 'Diaz',     'estudiante'),
      ('camila@handsup.com',     'Estudiante2026', 'Camila',     'Ortiz',    'estudiante'),
      ('daniel@handsup.com',     'Estudiante2026', 'Daniel',     'Vargas',   'estudiante'),
      ('luciana@handsup.com',    'Estudiante2026', 'Luciana',    'Moreno',   'estudiante')
    ) as t(email, clave, nombre, apellido, rol)
  loop
    if exists (select 1 from auth.users where email = u.email) then
      continue;
    end if;
    nuevo_id := gen_random_uuid();

    -- Usuario confirmado, con la contraseña cifrada con bcrypt
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', nuevo_id, 'authenticated', 'authenticated',
      u.email, extensions.crypt(u.clave, extensions.gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nombre', u.nombre, 'apellido', u.apellido, 'rol', u.rol),
      now(), now(), '', '', '', ''
    );

    -- Identidad de tipo "email" (necesaria para iniciar sesión con correo)
    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), nuevo_id, nuevo_id::text, 'email',
      jsonb_build_object('sub', nuevo_id::text, 'email', u.email, 'email_verified', true),
      now(), now(), now()
    );
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 2. Datos de perfil (SCRUM-43, 47 y 48)
-- ---------------------------------------------------------------------
update public.perfiles p set
  apellido     = 'Martínez',
  bio          = 'Docente de LSC con 5 años de experiencia.',
  enlace_clase = 'https://meet.google.com/abc-defg-hij'
from auth.users u
where u.id = p.id and u.email = 'docente@handsup.com';

update public.perfiles p set telefono = '3001234549'
from auth.users u
where u.id = p.id and u.email = 'estudiante@handsup.com';


-- ---------------------------------------------------------------------
-- 3. Módulo y lecciones de Laura (SCRUM-33 y 36)
-- ---------------------------------------------------------------------
do $$
declare
  v_laura  uuid := (select id from auth.users where email = 'docente@handsup.com');
  v_modulo uuid;
begin
  select id into v_modulo from public.modulos where profesor_id = v_laura and titulo = 'Módulo inicial';
  if v_modulo is null then
    insert into public.modulos (profesor_id, titulo, descripcion, icono, orden, esta_habilitado, requiere_clase_bienvenida)
    values (v_laura, 'Módulo inicial', 'Lecciones creadas antes de los módulos.', 'hand', 1, true, false)
    returning id into v_modulo;
  end if;

  insert into public.lecciones (profesor_id, modulo_id, titulo, descripcion, contenido, esta_habilitada, orden)
  select v_laura, v_modulo, t.titulo, t.descripcion, 'Contenido de ejemplo', t.habilitada, t.orden
  from (values
    ('Alfabeto y deletreo',      'Aprende a deletrear letra por letra',     1, true),
    ('Saludos y presentaciones', 'El primer paso para encontrarnos en LSC', 2, true),
    ('Numeros y tiempo',         'Expresa cantidades y organiza tu dia',    3, true),
    ('Tu primera conversacion',  'Practica lo aprendido con tu docente',    4, true),
    ('Familia y personas',       'Presenta a tu familia en LSC',            5, true),
    ('Colores y objetos',        'Describe lo que ves a tu alrededor',      6, true),
    ('Lugares de la ciudad',     'Pregunta y da direcciones',               7, true),
    ('Emociones y sentimientos', 'Expresa cómo te sientes',                 8, true),
    ('Verbos cotidianos',        'Acciones del día a día',                  9, false),
    ('Conversación en clase',    'Participa en una clase en LSC',          10, false)
  ) as t(titulo, descripcion, orden, habilitada)
  where not exists (select 1 from public.lecciones l where l.titulo = t.titulo);

  -- Las lecciones que existían antes de los módulos quedan dentro del "Módulo inicial".
  update public.lecciones set modulo_id = v_modulo where profesor_id = v_laura and modulo_id is null;
end $$;


-- ---------------------------------------------------------------------
-- 4. Ejercicios de ejemplo (SCRUM-38)
-- ---------------------------------------------------------------------
insert into public.ejercicios (leccion_id, pregunta, opciones, respuesta_correcta, orden)
select l.id, t.pregunta, t.opciones, t.correcta, t.orden
from public.lecciones l
cross join (values
  ('¿Con cuántas manos se deletrea en LSC?', array['Una', 'Dos'], 0, 1),
  ('¿Qué seña usamos para saludar?', array['Hola', 'Gracias', 'Adiós'], 0, 2)
) as t(pregunta, opciones, correcta, orden)
where l.titulo = 'Saludos y presentaciones'
  and not exists (select 1 from public.ejercicios e where e.leccion_id = l.id and e.pregunta = t.pregunta);


-- ---------------------------------------------------------------------
-- 5. Horarios, clases y progreso (SCRUM-41, 42 y 39)
-- ---------------------------------------------------------------------
do $$
declare
  v_doc        record;
  v_estudiantes uuid[];
  v_titulos    text[];
  v_semana     int;
  v_dia        int;
  v_hora       int;
  v_inicio     timestamptz;
  v_horario    uuid;
  v_contador   int := 0;
  v_reservar   boolean;
  v_estado     public.reunion_estado;
  v_lunes      date := date_trunc('week', current_date)::date;
begin
  select array_agg(p.id order by p.nombre) into v_estudiantes
  from public.perfiles p where p.rol = 'estudiante';

  select array_agg(l.titulo order by l.orden) into v_titulos
  from public.lecciones l where l.esta_habilitada is true;

  -- Horarios de 45 minutos (hora de Colombia): 2 semanas atrás y 3 adelante
  for v_doc in
    select u.id,
           case u.email
             when 'docente@handsup.com' then array[8, 9, 10, 11, 14, 15, 16]
             else array[12, 13, 17, 18, 19]
           end as horas
    from auth.users u
    join public.perfiles p on p.id = u.id
    where u.email in ('docente@handsup.com', 'carlos@handsup.com') and p.rol = 'profesor'
  loop
    for v_semana in -2..3 loop
      for v_dia in 0..4 loop
        foreach v_hora in array v_doc.horas loop
          -- Dos de cada tres espacios tienen horario
          if ((v_semana + 2) * 5 + v_dia + v_hora) % 3 = 0 then
            continue;
          end if;

          v_inicio := ((v_lunes + v_semana * 7 + v_dia) + make_time(v_hora, 0, 0)) at time zone 'America/Bogota';

          if exists (select 1 from public.horarios_disponibles
                     where profesor_id = v_doc.id and fecha_inicio = v_inicio) then
            continue;
          end if;

          v_contador := v_contador + 1;
          -- Pasado: 60 % con clase. Futuro: 40 % con clase.
          v_reservar := case when v_inicio < now()
                             then v_contador % 5 in (0, 1, 2)
                             else v_contador % 5 in (0, 1) end;

          insert into public.horarios_disponibles (profesor_id, fecha_inicio, fecha_fin, esta_disponible)
          values (v_doc.id, v_inicio, v_inicio + interval '45 minutes', not v_reservar)
          returning id into v_horario;

          if v_reservar then
            if v_inicio < now() then
              v_estado := case when v_contador % 7 = 0 then 'cancelada' else 'completada' end;
            else
              v_estado := case when v_contador % 3 = 0 then 'pendiente' else 'confirmada' end;
            end if;

            insert into public.reuniones (estudiante_id, profesor_id, horario_id, fecha_inicio, fecha_fin, estado, notas)
            values (
              v_estudiantes[(v_contador % array_length(v_estudiantes, 1)) + 1],
              v_doc.id, v_horario, v_inicio, v_inicio + interval '45 minutes', v_estado,
              v_titulos[(v_contador % array_length(v_titulos, 1)) + 1]
            );

            if v_estado = 'cancelada' then
              update public.horarios_disponibles set esta_disponible = true where id = v_horario;
            end if;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  -- Progreso: cuántas lecciones (en orden) completó cada estudiante
  insert into public.progreso_lecciones (estudiante_id, leccion_id, completada, calificacion, fecha_completado)
  select u.id, l.id, true,
         70 + abs(hashtext(u.email || l.titulo)) % 31,
         now() - make_interval(days => (p.hasta - l.orden) * 3 + 1)
  from (values
    ('estudiante@handsup.com', 1), ('sofia@handsup.com', 2),     ('andres@handsup.com', 3),
    ('mateo@handsup.com', 6),      ('isabella@handsup.com', 8),  ('samuel@handsup.com', 0),
    ('mariana@handsup.com', 4),    ('juanpablo@handsup.com', 5), ('camila@handsup.com', 2),
    ('daniel@handsup.com', 7),     ('luciana@handsup.com', 3)
  ) as p(email, hasta)
  join auth.users u on u.email = p.email
  join public.lecciones l on l.orden <= p.hasta and l.esta_habilitada is true
  where not exists (
    select 1 from public.progreso_lecciones x
    where x.estudiante_id = u.id and x.leccion_id = l.id
  );
end $$;


-- ---------------------------------------------------------------------
-- 6. Verificación
-- ---------------------------------------------------------------------
select p.rol, count(*) as cuentas from public.perfiles p group by p.rol
union all
select 'lecciones', count(*) from public.lecciones
union all
select 'horarios', count(*) from public.horarios_disponibles
union all
select 'clases', count(*) from public.reuniones
union all
select 'lecciones completadas', count(*) from public.progreso_lecciones
union all
select 'ejercicios', count(*) from public.ejercicios;
