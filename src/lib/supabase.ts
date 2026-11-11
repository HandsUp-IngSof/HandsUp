import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !clave) {
  throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env");
}

// Cliente unico de Supabase para toda la aplicacion.
export const supabase = createClient(url, clave);
