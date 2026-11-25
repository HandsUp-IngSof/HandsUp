import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { FormularioPerfil } from "@/componentes/perfil/FormularioPerfil";

// "Mi perfil" del estudiante (SCRUM-47): ver y actualizar su informacion y su celular de contacto.
// Desde SCRUM-58 se muestra dentro del panel (menu "···" -> Mi perfil).
export function PerfilEstudiante() {
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoSeccion
        titulo="Mi perfil"
        descripcion="Actualiza tu información y el celular con el que tus docentes pueden contactarte."
      />
      <FormularioPerfil
        rolTexto="Estudiante de LSC"
        conTelefono
        ejemploBio="Ej: Quiero aprender LSC para comunicarme con mi hermano."
      />
    </div>
  );
}
