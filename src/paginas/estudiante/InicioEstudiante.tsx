import { usePerfil } from "@/componentes/RutaProtegida";
import { consejoDelDia } from "@/paginas/estudiante/modelo";
import { ConDatos } from "@/paginas/estudiante/secciones/EstadoCarga";
import { RutaAprendizaje } from "@/paginas/estudiante/secciones/RutaAprendizaje";
import { SaludoEstudiante } from "@/paginas/estudiante/secciones/SaludoEstudiante";
import { TarjetaSiguientePaso } from "@/paginas/estudiante/secciones/TarjetaSiguientePaso";
import {
  TarjetaConsejo,
  TarjetaInsignias,
  TarjetaProgreso,
  TarjetaProximaClase,
} from "@/paginas/estudiante/secciones/TarjetasLaterales";

// "Mi aprendizaje": dashboard personalizado del estudiante (SCRUM-33), con datos reales de Supabase:
// su siguiente paso, la ruta de modulos publicados por los docentes, su progreso (SCRUM-34),
// sus insignias (SCRUM-35) y su proxima clase (SCRUM-39).
export function InicioEstudiante() {
  const perfil = usePerfil();

  return (
    <div className="space-y-6">
      <SaludoEstudiante nombre={perfil.nombre} />

      <ConDatos>
        {(vista) => (
          // Escritorio: contenido + columna derecha. Tableta: columna derecha abajo en 2 columnas. Celular: todo en una.
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-8">
              <TarjetaSiguientePaso paso={vista.siguientePaso} />
              <RutaAprendizaje modulos={vista.modulos} />
            </div>
            <div className="grid content-start items-start gap-6 md:grid-cols-2 xl:grid-cols-1">
              <TarjetaProgreso progreso={vista.progreso} />
              <TarjetaProximaClase clase={vista.claseDestacada} bienvenidaCumplida={vista.bienvenidaCumplida} />
              <TarjetaInsignias insignias={vista.insignias} />
              <TarjetaConsejo consejo={consejoDelDia()} />
            </div>
          </div>
        )}
      </ConDatos>
    </div>
  );
}
