import { AlertCircle, RefreshCw } from "lucide-react";

import { Cargando } from "@/componentes/UI/Cargando";
import { useDatosEstudiante } from "@/paginas/estudiante/DatosEstudiante";
import type { VistaEstudiante } from "@/paginas/estudiante/modelo";

// Muestra el indicador de carga o el error del panel y, cuando ya hay datos, los entrega a la pagina.
export function ConDatos({ children }: { children: (vista: VistaEstudiante) => React.ReactNode }) {
  const { vista, cargando, error, recargar } = useDatosEstudiante();

  if (vista) return <>{children(vista)}</>;
  if (cargando) return <Cargando texto="Cargando tu aprendizaje..." pantallaCompleta={false} />;

  return (
    <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
      <p className="mt-3 text-sm text-red-700">{error ?? "No se pudo cargar tu información."}</p>
      <button
        type="button"
        onClick={() => void recargar()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75]"
      >
        <RefreshCw className="h-4 w-4" />
        Intentar de nuevo
      </button>
    </div>
  );
}
