import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { FormularioPerfil } from "@/componentes/perfil/FormularioPerfil";

// "Mi perfil" del estudiante (SCRUM-47): ver y actualizar su informacion y su celular de contacto.
export function PerfilEstudiante() {
  return (
    <main className="min-h-screen bg-[#F4F7F7] px-4 py-8 font-['Fredoka',sans-serif] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/estudiante"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#14848D] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mi panel
        </Link>
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
    </main>
  );
}
