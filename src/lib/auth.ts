import { supabase } from "@/lib/supabase";

// Rol que el usuario elige en la pantalla de login.
export type RolPantalla = "estudiante" | "docente";

// Rol guardado en la base de datos (enum user_role).
export type RolBD = "estudiante" | "profesor" | "administrador";

export interface Perfil {
  id: string;
  nombre: string;
  apellido: string;
  rol: RolBD;
}

// La pantalla dice "docente", pero en la base de datos el rol se llama "profesor".
const ROL_EN_BD: Record<RolPantalla, RolBD> = {
  estudiante: "estudiante",
  docente: "profesor",
};

// Convierte los mensajes de Supabase en mensajes claros para el usuario.
function traducirError(mensaje: string): string {
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("Email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión.";
  }
  if (mensaje.includes("Failed to fetch")) {
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet.";
  }
  if (mensaje.includes("User already registered")) {
    return "Ya existe una cuenta con este correo.";
  }
  if (mensaje.includes("Password should")) {
    return "La contraseña no cumple los requisitos mínimos de seguridad.";
  }
  if (mensaje.includes("rate limit")) {
    return "Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function obtenerPerfil(idUsuario: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido, rol")
    .eq("id", idUsuario)
    .maybeSingle();

  if (error) throw new Error("No se pudo consultar el perfil del usuario.");
  return data;
}

// Supabase Auth valida la contrasena contra su hash bcrypt y entrega una sesion (JWT).
// Despues se comprueba que el rol del perfil coincida con el rol elegido en la pantalla.
export async function iniciarSesion(
  email: string,
  password: string,
  rolElegido: RolPantalla,
): Promise<Perfil> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(traducirError(error.message));

  const perfil = await obtenerPerfil(data.user.id);

  if (!perfil) {
    await supabase.auth.signOut();
    throw new Error("Tu cuenta no tiene un perfil asociado. Contacta al administrador.");
  }

  if (perfil.rol !== ROL_EN_BD[rolElegido]) {
    await supabase.auth.signOut();
    throw new Error(`Esta cuenta no está registrada como ${rolElegido}. Elige el rol correcto.`);
  }

  return perfil;
}

// Separa "Nombre completo" en nombre y apellido, porque la tabla perfiles los guarda aparte.
// Con 4 o mas palabras toma las dos primeras como nombre (ej. "Maria Jose Perez Gomez").
export function separarNombre(nombreCompleto: string): { nombre: string; apellido: string } {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const cantidadNombres = partes.length >= 4 ? 2 : 1;
  return {
    nombre: partes.slice(0, cantidadNombres).join(" "),
    apellido: partes.slice(cantidadNombres).join(" "),
  };
}

export interface DatosRegistro {
  nombreCompleto: string;
  email: string;
  password: string;
  rol: RolPantalla;
}

// "sesion_iniciada": la cuenta quedo lista y el usuario ya puede entrar.
// "confirmar_correo": Supabase envio un correo de confirmacion (opcion "Confirm email" activa).
export type ResultadoRegistro = "sesion_iniciada" | "confirmar_correo";

// Crea la cuenta en Supabase Auth. La contrasena se guarda cifrada con bcrypt y el
// trigger handle_new_user crea el perfil con el nombre, el apellido y el rol enviados.
export async function registrarUsuario(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const { nombre, apellido } = separarNombre(datos.nombreCompleto);

  const { data, error } = await supabase.auth.signUp({
    email: datos.email.trim(),
    password: datos.password,
    options: {
      data: {
        nombre,
        apellido: apellido || undefined,
        rol: datos.rol, // "docente" se guarda como "profesor" en la base de datos
      },
    },
  });

  if (error) throw new Error(traducirError(error.message));

  // Con "Confirm email" activo, Supabase no avisa si el correo ya existe:
  // devuelve un usuario sin identidades.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("Ya existe una cuenta con este correo.");
  }

  return data.session ? "sesion_iniciada" : "confirmar_correo";
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export function rutaSegunRol(rol: RolBD): string {
  return rol === "profesor" ? "/docente" : "/estudiante";
}
