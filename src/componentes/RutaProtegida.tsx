import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Cargando } from "@/componentes/UI/Cargando";
import { supabase } from "@/lib/supabase";
import { guardarPerfilEnMemoria, obtenerPerfil, olvidarPerfil, type Perfil, type RolBD } from "@/lib/auth";

const PerfilContext = createContext<Perfil | null>(null);
const ActualizarPerfilContext = createContext<((cambios: Partial<Perfil>) => void) | null>(null);

// Devuelve el perfil del usuario con sesion iniciada. Solo funciona dentro de una RutaProtegida.
export function usePerfil(): Perfil {
  const perfil = useContext(PerfilContext);
  if (!perfil) throw new Error("usePerfil debe usarse dentro de una RutaProtegida");
  return perfil;
}

// Devuelve una funcion para actualizar el perfil en pantalla (por ejemplo, al cambiar la foto)
// sin tener que recargar la pagina.
export function useActualizarPerfil(): (cambios: Partial<Perfil>) => void {
  const actualizar = useContext(ActualizarPerfilContext);
  if (!actualizar) throw new Error("useActualizarPerfil debe usarse dentro de una RutaProtegida");
  return actualizar;
}

interface RutaProtegidaProps {
  rol: RolBD;
  children: ReactNode;
}

// Solo deja ver la pagina si hay una sesion activa y el rol del perfil coincide.
// En cualquier otro caso redirige al login.
export function RutaProtegida({ rol, children }: RutaProtegidaProps) {
  const [estado, setEstado] = useState<"cargando" | "permitido" | "denegado">("cargando");
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    let activo = true;

    async function verificar() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (activo) setEstado("denegado");
        return;
      }

      const encontrado = await obtenerPerfil(data.session.user.id).catch(() => null);
      if (!activo) return;

      if (encontrado && encontrado.rol === rol) {
        setPerfil(encontrado);
        setEstado("permitido");
      } else {
        setEstado("denegado");
      }
    }

    verificar();
    return () => {
      activo = false;
    };
  }, [rol]);

  // Si en otra pestaña se cierra la sesion o se entra con otra cuenta, esta pestaña
  // no puede seguir mostrando a la persona anterior: vuelve al login.
  const perfilId = perfil?.id;
  useEffect(() => {
    if (!perfilId) return;
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "INITIAL_SESSION") return;
      if (!sesion || sesion.user.id !== perfilId) {
        olvidarPerfil();
        window.location.replace("/login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [perfilId]);

  const actualizarPerfil = useCallback((cambios: Partial<Perfil>) => {
    setPerfil((actual) => {
      if (!actual) return actual;
      const nuevo = { ...actual, ...cambios };
      guardarPerfilEnMemoria(nuevo);
      return nuevo;
    });
  }, []);

  if (estado === "cargando") {
    return <Cargando texto="Verificando tu sesión..." />;
  }

  if (estado === "denegado" || !perfil) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ActualizarPerfilContext.Provider value={actualizarPerfil}>
      <PerfilContext.Provider value={perfil}>{children}</PerfilContext.Provider>
    </ActualizarPerfilContext.Provider>
  );
}
