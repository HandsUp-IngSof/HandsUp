import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { TarjetaDisponibilidad } from "@/paginas/docente/secciones/TarjetaDisponibilidad";

// Pagina "Calendario" del docente.
// Aqui se implementan SCRUM-41 (disponibilidad horaria) y SCRUM-43 (enlace de videollamada).
export function CalendarioDocente() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Calendario"
        descripcion="Gestiona tu disponibilidad semanal y el enlace de tus clases virtuales."
      />
      <TarjetaDisponibilidad />
    </>
  );
}
