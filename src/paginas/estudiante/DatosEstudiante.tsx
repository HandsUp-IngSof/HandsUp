import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { cargarDatosEstudiante, completarLeccion } from "@/paginas/estudiante/consultas";
import { construirVista, type Insignia, type VistaEstudiante } from "@/paginas/estudiante/modelo";

// Datos del estudiante (modulos, progreso, clases, insignias) cargados una sola vez
// al entrar al panel y compartidos por todas sus paginas (SCRUM-33).

interface ContextoDatos {
  vista: VistaEstudiante | null;
  cargando: boolean;
  error: string | null;
  // Vuelve a consultar Supabase (por ejemplo, despues de agendar una clase).
  recargar: () => Promise<void>;
  // Marca una leccion como completada, recarga y devuelve las insignias nuevas (SCRUM-34 y 35).
  completar: (leccionId: string) => Promise<Insignia[]>;
}

const Contexto = createContext<ContextoDatos | null>(null);

export function useDatosEstudiante(): ContextoDatos {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useDatosEstudiante debe usarse dentro de ProveedorDatosEstudiante");
  return contexto;
}

// Proveedor: carga los datos del estudiante y los comparte con las paginas del panel.
export function ProveedorDatosEstudiante({ children }: { children: ReactNode }) {
  const perfil = usePerfil();
  const [vista, setVista] = useState<VistaEstudiante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vistaRef = useRef<VistaEstudiante | null>(null);

  const cargar = useCallback(async (): Promise<VistaEstudiante> => {
    const datos = await cargarDatosEstudiante(perfil.id);
    const nueva = construirVista(datos);
    vistaRef.current = nueva;
    setVista(nueva);
    return nueva;
  }, [perfil.id]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    cargar()
      .catch((err: Error) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [cargar]);

  const recargar = useCallback(async () => {
    try {
      await cargar();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron actualizar tus datos.");
    }
  }, [cargar]);

  const completar = useCallback(
    async (leccionId: string): Promise<Insignia[]> => {
      const antes = new Set(vistaRef.current?.insignias.filter((i) => i.obtenidaEn).map((i) => i.id));
      await completarLeccion(leccionId);
      const nueva = await cargar();
      return nueva.insignias.filter((i) => i.obtenidaEn && !antes.has(i.id));
    },
    [cargar],
  );

  const valor = useMemo(
    () => ({ vista, cargando, error, recargar, completar }),
    [vista, cargando, error, recargar, completar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
