-- =====================================================================
-- handsUp · Script de CREACIÓN DE TABLAS (PostgreSQL / Supabase)
-- Correr en Supabase > SQL Editor sobre un proyecto nuevo, ANTES de
-- basedatos/datos-de-prueba.sql.
--
-- Contenido:
--   1. Extensiones
--   2. Tipos (roles y estados de una clase)
--   3. Tablas con sus llaves primarias, foráneas y restricciones (13 tablas)
--   4. Índices
--   5. Perfil automático al registrarse (trigger sobre auth.users)
--   6. Seguridad por filas (RLS) de las tablas base (SCRUM-32)
--   7. Almacenamiento de fotos de perfil (SCRUM-45)
--
-- Las reglas, funciones y triggers de cada funcionalidad están en su propio
-- script dentro de basedatos/ (correrlos después de este, en este orden):
--   SCRUM-44-mensajeria.sql, SCRUM-49-notificaciones.sql, SCRUM-52-vaciado-chats.sql,
--   SCRUM-38-ejercicios.sql, SCRUM-37-bloqueo-de-modulos.sql, SCRUM-39-confirmar-reservas.sql
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Extensiones
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions; -- gen_random_uuid() y cifrado bcrypt
create extension if not exists pg_cron;                         -- tareas programadas (SCRUM-52)


-- ---------------------------------------------------------------------
-- 2. Tipos
-- ---------------------------------------------------------------------
create type public.user_role as enum ('estudiante', 'profesor', 'administrador');
create type public.reunion_estado as enum ('pendiente', 'confirmada', 'completada', 'cancelada');


-- ---------------------------------------------------------------------
-- 3. Tablas (en orden: primero las que son referenciadas por otras)
-- ---------------------------------------------------------------------

-- Perfil de cada usuario (la cuenta y la contraseña cifrada viven en auth.users)
create table public.perfiles (
  id             uuid not null,
  nombre         text not null,
  apellido       text not null,
  rol            public.user_role not null default 'estudiante'::public.user_role,
  avatar_url     text,
  bio            text,
  creado_en      timestamptz not null default timezone('utc'::text, now()),
  actualizado_en timestamptz not null default timezone('utc'::text, now()),
  enlace_clase   text,
  telefono       text check (telefono is null or telefono ~ '^3[0-9]{9}$'::text),
  constraint perfiles_pkey primary key (id),
  constraint perfiles_id_fkey foreign key (id) references auth.users (id)
);

-- Horarios que publica cada docente
create table public.horarios_disponibles (
  id              uuid not null default gen_random_uuid(),
  profesor_id     uuid not null,
  fecha_inicio    timestamptz not null,
  fecha_fin       timestamptz not null,
  esta_disponible boolean default true,
  creado_en       timestamptz not null default timezone('utc'::text, now()),
  constraint horarios_disponibles_pkey primary key (id),
  constraint horarios_disponibles_profesor_id_fkey foreign key (profesor_id) references public.perfiles (id)
);

-- Clases agendadas entre un estudiante y un docente
create table public.reuniones (
  id            uuid not null default gen_random_uuid(),
  estudiante_id uuid not null,
  profesor_id   uuid not null,
  horario_id    uuid,
  fecha_inicio  timestamptz not null,
  fecha_fin     timestamptz not null,
  estado        public.reunion_estado default 'pendiente'::public.reunion_estado,
  notas         text,
  creado_en     timestamptz not null default timezone('utc'::text, now()),
  constraint reuniones_pkey primary key (id),
  constraint reuniones_estudiante_id_fkey foreign key (estudiante_id) references public.perfiles (id),
  constraint reuniones_profesor_id_fkey foreign key (profesor_id) references public.perfiles (id),
  constraint reuniones_horario_id_fkey foreign key (horario_id) references public.horarios_disponibles (id)
);

-- Módulos de la ruta de aprendizaje (agrupan lecciones)
create table public.modulos (
  id                        uuid not null default gen_random_uuid(),
  profesor_id               uuid not null,
  titulo                    text not null check (char_length(btrim(titulo)) >= 2 and char_length(btrim(titulo)) <= 120),
  descripcion               text check (descripcion is null or char_length(descripcion) <= 400),
  icono                     text not null default 'hand'::text,
  orden                     integer not null default 0,
  esta_habilitado           boolean not null default false,
  requiere_clase_bienvenida boolean not null default false,
  duracion_min              integer check (duracion_min is null or (duracion_min >= 1 and duracion_min <= 600)),
  creado_en                 timestamptz not null default now(),
  constraint modulos_pkey primary key (id),
  constraint modulos_profesor_id_fkey foreign key (profesor_id) references public.perfiles (id)
);

-- Lecciones de cada módulo
create table public.lecciones (
  id              uuid not null default gen_random_uuid(),
  profesor_id     uuid not null,
  titulo          text not null,
  descripcion     text,
  contenido       text,
  esta_habilitada boolean default false,
  orden           integer default 1,
  creado_en       timestamptz not null default timezone('utc'::text, now()),
  modulo_id       uuid,
  video_url       text,
  constraint lecciones_pkey primary key (id),
  constraint lecciones_profesor_id_fkey foreign key (profesor_id) references public.perfiles (id),
  -- Al eliminar un módulo se eliminan sus lecciones
  constraint lecciones_modulo_id_fkey foreign key (modulo_id) references public.modulos (id) on delete cascade
);

-- Lecciones completadas por cada estudiante
create table public.progreso_lecciones (
  id               uuid not null default gen_random_uuid(),
  estudiante_id    uuid not null,
  leccion_id       uuid not null,
  completada       boolean default false,
  calificacion     numeric,
  fecha_completado timestamptz,
  actualizado_en   timestamptz not null default timezone('utc'::text, now()),
  constraint progreso_lecciones_pkey primary key (id),
  constraint progreso_lecciones_estudiante_id_fkey foreign key (estudiante_id) references public.perfiles (id),
  constraint progreso_lecciones_leccion_id_fkey foreign key (leccion_id) references public.lecciones (id)
);

-- Catálogo de insignias (gamificación, SCRUM-35)
create table public.insignias (
  id          uuid not null default gen_random_uuid(),
  codigo      text not null,
  nombre      text not null,
  descripcion text not null,
  icono       text not null default 'star'::text,
  criterio    text not null check (criterio = any (array['lecciones'::text, 'modulos'::text, 'racha'::text, 'clases'::text])),
  valor       integer not null check (valor > 0),
  orden       integer not null default 0,
  activa      boolean not null default true,
  constraint insignias_pkey primary key (id),
  constraint insignias_codigo_key unique (codigo)
);

-- Insignias que ganó cada estudiante
create table public.insignias_estudiante (
  id            uuid not null default gen_random_uuid(),
  estudiante_id uuid not null,
  insignia_id   uuid not null,
  obtenida_en   timestamptz not null default now(),
  constraint insignias_estudiante_pkey primary key (id),
  constraint insignias_estudiante_estudiante_id_fkey foreign key (estudiante_id) references public.perfiles (id),
  constraint insignias_estudiante_insignia_id_fkey foreign key (insignia_id) references public.insignias (id)
);

-- Conversaciones del chat entre un docente y un estudiante (SCRUM-44)
create table public.conversaciones (
  id            uuid not null default gen_random_uuid(),
  profesor_id   uuid not null,
  estudiante_id uuid not null,
  creado_en     timestamptz not null default now(),
  constraint conversaciones_pkey primary key (id),
  constraint conversaciones_profesor_id_estudiante_id_key unique (profesor_id, estudiante_id),
  constraint conversaciones_profesor_id_fkey foreign key (profesor_id) references public.perfiles (id) on delete cascade,
  constraint conversaciones_estudiante_id_fkey foreign key (estudiante_id) references public.perfiles (id) on delete cascade
);

-- Mensajes del chat (SCRUM-44)
create table public.mensajes (
  id              uuid not null default gen_random_uuid(),
  conversacion_id uuid not null,
  autor_id        uuid not null,
  texto           text not null check (char_length(btrim(texto)) >= 1 and char_length(btrim(texto)) <= 1000),
  creado_en       timestamptz not null default now(),
  leido_en        timestamptz,
  constraint mensajes_pkey primary key (id),
  constraint mensajes_conversacion_id_fkey foreign key (conversacion_id) references public.conversaciones (id) on delete cascade,
  constraint mensajes_autor_id_fkey foreign key (autor_id) references public.perfiles (id) on delete cascade
);

-- Notificaciones de cada usuario (SCRUM-49)
create table public.notificaciones (
  id         uuid not null default gen_random_uuid(),
  usuario_id uuid not null,
  tipo       text not null check (tipo = any (array['mensaje'::text, 'clase'::text, 'sistema'::text])),
  titulo     text not null,
  texto      text,
  enlace     text,
  leida      boolean not null default false,
  creado_en  timestamptz not null default now(),
  constraint notificaciones_pkey primary key (id),
  constraint notificaciones_usuario_id_fkey foreign key (usuario_id) references public.perfiles (id) on delete cascade
);

-- Ejercicios de opción múltiple de cada lección (SCRUM-38)
create table public.ejercicios (
  id                 uuid not null default gen_random_uuid(),
  leccion_id         uuid not null,
  pregunta           text not null check (char_length(btrim(pregunta)) >= 3 and char_length(btrim(pregunta)) <= 300),
  opciones           text[] not null check (array_length(opciones, 1) >= 2 and array_length(opciones, 1) <= 4),
  respuesta_correcta smallint not null,
  orden              integer not null default 0,
  creado_en          timestamptz not null default now(),
  constraint ejercicios_pkey primary key (id),
  constraint ejercicios_respuesta_valida check (respuesta_correcta >= 0 and respuesta_correcta < array_length(opciones, 1)),
  constraint ejercicios_leccion_id_fkey foreign key (leccion_id) references public.lecciones (id) on delete cascade
);

-- Intentos y notas de los ejercicios (SCRUM-38)
create table public.intentos_leccion (
  id            uuid not null default gen_random_uuid(),
  leccion_id    uuid not null,
  estudiante_id uuid not null,
  correctas     integer not null,
  total         integer not null,
  puntaje       integer not null,
  aprobado      boolean not null,
  creado_en     timestamptz not null default now(),
  constraint intentos_leccion_pkey primary key (id),
  constraint intentos_leccion_leccion_id_fkey foreign key (leccion_id) references public.lecciones (id) on delete cascade,
  constraint intentos_leccion_estudiante_id_fkey foreign key (estudiante_id) references public.perfiles (id) on delete cascade
);


-- ---------------------------------------------------------------------
-- 4. Índices (consultas frecuentes)
-- ---------------------------------------------------------------------
create index mensajes_conversacion_fecha on public.mensajes (conversacion_id, creado_en);
create index notificaciones_usuario_fecha on public.notificaciones (usuario_id, creado_en desc);
create index ejercicios_leccion on public.ejercicios (leccion_id, orden);
create index intentos_estudiante_leccion on public.intentos_leccion (estudiante_id, leccion_id);


-- ---------------------------------------------------------------------
-- 5. Perfil automático al registrarse (SCRUM-31)
--    Toma nombre, apellido y rol de los datos del registro. "docente" se guarda como "profesor".
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rol_pedido text := new.raw_user_meta_data->>'rol';
begin
  insert into public.perfiles (id, nombre, apellido, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Nuevo'),
    coalesce(new.raw_user_meta_data->>'apellido', 'Usuario'),
    case
      when rol_pedido = 'profesor' or rol_pedido = 'docente' then 'profesor'::public.user_role
      else 'estudiante'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 6. Seguridad por filas (RLS) de las tablas base (SCRUM-32)
-- ---------------------------------------------------------------------
alter table public.perfiles             enable row level security;
alter table public.horarios_disponibles enable row level security;
alter table public.reuniones            enable row level security;
alter table public.modulos              enable row level security;
alter table public.lecciones            enable row level security;
alter table public.progreso_lecciones   enable row level security;
alter table public.insignias            enable row level security;
alter table public.insignias_estudiante enable row level security;
alter table public.conversaciones       enable row level security;
alter table public.mensajes             enable row level security;
alter table public.notificaciones       enable row level security;
alter table public.ejercicios           enable row level security;
alter table public.intentos_leccion     enable row level security;

-- Rol del usuario con sesión iniciada
create or replace function public.rol_actual()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles where id = (select auth.uid());
$$;

-- Perfiles: los usuarios con sesión pueden leerlos; cada uno edita el suyo sin cambiar su rol
create policy "perfiles_lectura_autenticados" on public.perfiles
  for select to authenticated using (true);

create policy "perfiles_editar_propio_sin_cambiar_rol" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and rol = public.rol_actual());

create policy "perfiles_administrador" on public.perfiles
  for all to authenticated
  using (public.rol_actual() = 'administrador')
  with check (public.rol_actual() = 'administrador');

-- Lecciones: los estudiantes ven las publicadas; solo los docentes crean y editan
create policy "lecciones_leer" on public.lecciones
  for select to authenticated
  using (esta_habilitada is true or public.rol_actual() in ('profesor', 'administrador'));

create policy "lecciones_profesor_crear" on public.lecciones
  for insert to authenticated
  with check (public.rol_actual() = 'profesor' and profesor_id = (select auth.uid()));

create policy "lecciones_profesor_editar" on public.lecciones
  for update to authenticated
  using (public.rol_actual() = 'profesor')
  with check (public.rol_actual() = 'profesor');

create policy "lecciones_profesor_eliminar" on public.lecciones
  for delete to authenticated
  using (public.rol_actual() = 'profesor' and profesor_id = (select auth.uid()));

create policy "lecciones_administrador" on public.lecciones
  for all to authenticated
  using (public.rol_actual() = 'administrador')
  with check (public.rol_actual() = 'administrador');

-- Progreso: el estudiante ve y registra el suyo; los docentes lo consultan
create policy "progreso_leer" on public.progreso_lecciones
  for select to authenticated
  using (estudiante_id = (select auth.uid()) or public.rol_actual() in ('profesor', 'administrador'));

create policy "progreso_estudiante_crear" on public.progreso_lecciones
  for insert to authenticated
  with check (estudiante_id = (select auth.uid()) and public.rol_actual() = 'estudiante');

create policy "progreso_estudiante_actualizar" on public.progreso_lecciones
  for update to authenticated
  using (estudiante_id = (select auth.uid()))
  with check (estudiante_id = (select auth.uid()));

-- Horarios: todos los ven (para agendar); cada docente gestiona los suyos
create policy "horarios_leer" on public.horarios_disponibles
  for select to authenticated using (true);

create policy "horarios_profesor_crear" on public.horarios_disponibles
  for insert to authenticated
  with check (profesor_id = (select auth.uid()) and public.rol_actual() = 'profesor');

create policy "horarios_profesor_editar" on public.horarios_disponibles
  for update to authenticated
  using (profesor_id = (select auth.uid()))
  with check (profesor_id = (select auth.uid()));

create policy "horarios_profesor_eliminar" on public.horarios_disponibles
  for delete to authenticated
  using (profesor_id = (select auth.uid()));

-- Reuniones: cada uno ve las suyas; el estudiante agenda a su nombre
create policy "reuniones_leer" on public.reuniones
  for select to authenticated
  using (estudiante_id = (select auth.uid()) or profesor_id = (select auth.uid()));

create policy "reuniones_estudiante_crear" on public.reuniones
  for insert to authenticated
  with check (estudiante_id = (select auth.uid()) and public.rol_actual() = 'estudiante');

create policy "reuniones_participantes_actualizar" on public.reuniones
  for update to authenticated
  using (estudiante_id = (select auth.uid()) or profesor_id = (select auth.uid()))
  with check (estudiante_id = (select auth.uid()) or profesor_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 7. Fotos de perfil (SCRUM-45): bucket público "avatares", una carpeta por usuario
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares_lectura_publica" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "avatares_subir_propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatares_cambiar_propia" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatares_borrar_propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
