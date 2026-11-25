import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

// Boton pequeno para copiar un dato (correo, celular, enlace) al portapapeles.
// Lo usan el contacto del estudiante (SCRUM-51) y el contacto del docente (SCRUM-50).
export function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const temporizador = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(temporizador);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Si el navegador no deja copiar, el dato sigue visible para copiarlo a mano.
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${etiqueta}`}
      title={copiado ? "Copiado" : `Copiar ${etiqueta}`}
      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#14848D]"
    >
      {copiado ? <Check className="h-4 w-4 text-[#14848D]" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
