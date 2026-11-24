import { usePerfil } from "@/componentes/RutaProtegida";

import { Saludo } from "@/paginas/docente/secciones/Saludo";
import { AccesosRapidos } from "@/paginas/docente/secciones/AccesosRapidos";
import { TarjetaDisponibilidad } from "@/paginas/docente/secciones/TarjetaDisponibilidad";
import { TarjetaPerfil } from "@/paginas/docente/secciones/TarjetaPerfil";
import { TarjetaProximaClase } from "@/paginas/docente/secciones/TarjetaProximaClase";
import { TablaEstudiantes } from "@/paginas/docente/secciones/TablaEstudiantes";

// "Mi espacio": pagina de inicio del docente, segun el mockup de Figma.
export function InicioDocente() {
  const perfil = usePerfil();
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`.trim();

  return (
    <div className="space-y-6">
      <Saludo nombre={perfil.nombre} />
      <AccesosRapidos />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <TarjetaDisponibilidad />
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <TarjetaPerfil nombre={nombreCompleto} />
          <TarjetaProximaClase />
        </div>
      </div>

      <TablaEstudiantes />
    </div>
  );
}
