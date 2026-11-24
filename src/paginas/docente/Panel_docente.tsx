import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CalendarDays, LayoutGrid, MessagesSquare, Users } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { PlantillaPanel } from "@/componentes/layout/PlantillaPanel";
import type { EnlaceMenu } from "@/componentes/layout/BarraLateral";
import { Cargando } from "@/componentes/UI/Cargando";

const enlacesDocente: EnlaceMenu[] = [
  { texto: "Mi espacio", icono: LayoutGrid, ruta: "/docente", exacto: true },
  { texto: "Calendario", icono: CalendarDays, ruta: "/docente/calendario" },
  { texto: "Mis estudiantes", icono: Users, ruta: "/docente/estudiantes" },
  { texto: "Mensajes", icono: MessagesSquare, ruta: "/docente/mensajes", insignia: 2 },
];

// Estructura del panel docente (SCRUM-57). El menu lateral y el encabezado quedan fijos;
// en <Outlet /> se muestra la pagina elegida: inicio, calendario, estudiantes o mensajes.
export function PanelDocente() {
  const perfil = usePerfil();
  const { pathname } = useLocation();

  // Al cambiar de pagina, vuelve al inicio de la pantalla.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PlantillaPanel
      etiqueta="Espacio docente"
      enlaces={enlacesDocente}
      titulo="Mi espacio docente"
      subtitulo="Lengua de Señas Colombiana · LSC"
      nombre={`${perfil.nombre} ${perfil.apellido}`.trim()}
      rolTexto="Docente de LSC"
      avatarUrl={perfil.avatar_url}
    >
      <Suspense fallback={<Cargando pantallaCompleta={false} />}>
        <Outlet />
      </Suspense>
    </PlantillaPanel>
  );
}
