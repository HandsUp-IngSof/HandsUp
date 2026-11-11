// Comprueba la conexion con Supabase. Solo lee, no modifica ningun dato.
// Uso: npm run test:conexion
import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const TABLAS = [
  "perfiles",
  "lecciones",
  "progreso_lecciones",
  "horarios_disponibles",
  "reuniones",
];

// loadEnv lee el .env igual que lo hace la aplicacion al correr con Vite.
const env = loadEnv("development", process.cwd(), "VITE_");
const url = env.VITE_SUPABASE_URL;
const clave = env.VITE_SUPABASE_ANON_KEY;

if (!url || !clave) {
  console.error("ERROR: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env");
  process.exit(1);
}

const supabase = createClient(url, clave);
let fallos = 0;

console.log("Probando la conexion con Supabase...\n");

for (const tabla of TABLAS) {
  const { data, error } = await supabase.from(tabla).select("id").limit(1);

  if (error) {
    fallos++;
    console.log(`  FALLO  ${tabla}: ${error.message}`);
  } else {
    // Cero filas no es un error: la tabla puede estar vacia o protegida por RLS.
    console.log(`  OK     ${tabla} (filas visibles: ${data.length})`);
  }
}

if (fallos > 0) {
  console.error(`\nResultado: ${fallos} de ${TABLAS.length} tablas fallaron.`);
  process.exit(1);
}

console.log("\nResultado: conexion correcta.");
