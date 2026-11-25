import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BookOpen, CalendarDays, MessageCircle, MessagesSquare, Route, TrendingUp } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { PlantillaPanel } from "@/componentes/layout/PlantillaPanel";
import type { EnlaceMenu } from "@/componentes/layout/BarraLateral";
import type { OpcionMenu } from "@/componentes/layout/Encabezado";
import { Cargando } from "@/componentes/UI/Cargando";
import { ProveedorDatosEstudiante } from "@/paginas/estudiante/DatosEstudiante";

const enlacesEstudiante: EnlaceMenu[] = [
  { texto: "Mi aprendizaje", icono: Route, ruta: "/estudiante", exacto: true, incluye: "/estudiante/modulo" },
  { texto: "Diccionario LSC", icono: BookOpen, ruta: "/estudiante/diccionario" },
  { texto: "Mis clases", icono: CalendarDays, ruta: "/estudiante/clases" },
  { texto: "Mensajes", icono: MessagesSquare, ruta: "/estudiante/mensajes", insignia: 2 },
];

// "Tu espacio personal" del menu "···".
const opcionesEstudiante: OpcionMenu[] = [
  { texto: "Contactar al docente", icono: MessageCircle, ruta: "/estudiante/docente" }, // SCRUM-50
  { texto: "Ver progreso", icono: TrendingUp, ruta: "/estudiante/progreso" }, // SCRUM-34 y SCRUM-35
];

// Estructura del panel del estudiante (SCRUM-58), igual a la del docente (SCRUM-57):
// el menu lateral y el encabezado quedan fijos y en <Outlet /> se muestra la pagina elegida.
export function PanelEstudiante() {
  const perfil = usePerfil();
  const { pathname } = useLocation();

  // Al cambiar de pagina, vuelve al inicio de la pantalla.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PlantillaPanel
      etiqueta="Espacio estudiante"
      enlaces={enlacesEstudiante}
      titulo="Mi aprendizaje"
      subtitulo="Lengua de Señas Colombiana · LSC"
      nombre={`${perfil.nombre} ${perfil.apellido}`.trim()}
      rolTexto="Estudiante · Nivel inicial"
      avatarUrl={perfil.avatar_url}
      rutaPerfil="/estudiante/perfil"
      opcionesMenu={opcionesEstudiante}
    >
      {/* Los datos del estudiante se cargan una sola vez y los comparten todas sus paginas (SCRUM-33). */}
      <ProveedorDatosEstudiante>
        <Suspense fallback={<Cargando pantallaCompleta={false} />}>
          <Outlet />
        </Suspense>
      </ProveedorDatosEstudiante>
    </PlantillaPanel>
  );
}
