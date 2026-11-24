import { usePerfil } from "@/componentes/RutaProtegida";

import { claseBienvenida, consejoDelDia, modulos, progreso, siguientePaso } from "@/paginas/estudiante/datosEjemplo";
import { RutaAprendizaje } from "@/paginas/estudiante/secciones/RutaAprendizaje";
import { SaludoEstudiante } from "@/paginas/estudiante/secciones/SaludoEstudiante";
import { TarjetaSiguientePaso } from "@/paginas/estudiante/secciones/TarjetaSiguientePaso";
import {
  TarjetaClaseBienvenida,
  TarjetaConsejo,
  TarjetaProgreso,
} from "@/paginas/estudiante/secciones/TarjetasLaterales";

// "Mi aprendizaje": pagina de inicio del estudiante segun la maqueta de Figma (SCRUM-58).
// El nombre es real; el resto usa datos de ejemplo (datosEjemplo.ts) hasta SCRUM-33, 34, 35 y 39.
export function InicioEstudiante() {
  const perfil = usePerfil();

  return (
    <div className="space-y-6">
      <SaludoEstudiante nombre={perfil.nombre} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <TarjetaSiguientePaso paso={siguientePaso} />
          <RutaAprendizaje modulos={modulos} />
        </div>
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <TarjetaProgreso progreso={progreso} />
          <TarjetaClaseBienvenida clase={claseBienvenida} />
          <TarjetaConsejo consejo={consejoDelDia} />
        </div>
      </div>
    </div>
  );
}
