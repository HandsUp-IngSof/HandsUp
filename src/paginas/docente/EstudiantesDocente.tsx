import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { useResumenDocente } from "@/paginas/docente/useResumenDocente";
import { TablaEstudiantes } from "@/paginas/docente/secciones/TablaEstudiantes";

// Pagina "Mis estudiantes" del docente (SCRUM-42). El contacto se implementa en SCRUM-51.
export function EstudiantesDocente() {
  const { datos, cargando, error } = useResumenDocente();

  return (
    <>
      <EncabezadoSeccion
        titulo="Mis estudiantes"
        descripcion="Consulta el avance de cada estudiante y sus próximas clases."
      />
      <TablaEstudiantes
        estudiantes={datos?.estudiantes ?? []}
        cargando={cargando}
        error={error}
        mostrarVerTodos={false}
      />
    </>
  );
}
