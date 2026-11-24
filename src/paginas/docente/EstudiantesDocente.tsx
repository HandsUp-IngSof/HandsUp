import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { TablaEstudiantes } from "@/paginas/docente/secciones/TablaEstudiantes";

// Pagina "Mis estudiantes" del docente.
// Aqui se implementan SCRUM-42 (lista de estudiantes) y SCRUM-51 (datos de contacto).
export function EstudiantesDocente() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Mis estudiantes"
        descripcion="Consulta el avance de cada estudiante y sus próximas clases."
      />
      <TablaEstudiantes mostrarVerTodos={false} />
    </>
  );
}
