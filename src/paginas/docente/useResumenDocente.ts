import { useCallback, useEffect, useState } from "react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { obtenerResumenDocente, type ResumenDocente } from "@/paginas/docente/resumenDocente";

interface EstadoResumen {
  datos: ResumenDocente | null;
  cargando: boolean;
  error: string | null;
}

// Carga el resumen del docente con sesion iniciada (estudiantes, proxima clase y contadores).
// recargar(): vuelve a consultar (por ejemplo, despues de confirmar una reserva, SCRUM-39).
export function useResumenDocente(): EstadoResumen & { recargar: () => void } {
  const perfil = usePerfil();
  const [estado, setEstado] = useState<EstadoResumen>({ datos: null, cargando: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    obtenerResumenDocente(perfil.id)
      .then((datos) => activo && setEstado({ datos, cargando: false, error: null }))
      .catch((err: Error) => activo && setEstado({ datos: null, cargando: false, error: err.message }));
    return () => {
      activo = false;
    };
  }, [perfil.id, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { ...estado, recargar };
}
