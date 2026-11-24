import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { FormularioPerfil } from "@/componentes/perfil/FormularioPerfil";

// "Mi perfil" del docente (SCRUM-48): ver y actualizar su informacion.
export function PerfilDocente() {
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoSeccion
        titulo="Mi perfil"
        descripcion="Actualiza tu información. Así te verán tus estudiantes."
      />
      <FormularioPerfil rolTexto="Docente de LSC" />
    </div>
  );
}
