import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Loader2, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { Avatar } from "@/componentes/UI/Avatar";
import { Ventana } from "@/componentes/UI/Ventana";
import { formatoTelefono } from "@/lib/perfilUsuario";
import {
  enlaceCorreo,
  enlaceWhatsApp,
  obtenerContactoEstudiante,
  type ContactoEstudiante,
} from "@/paginas/docente/contactoEstudiante";

interface VentanaContactoEstudianteProps {
  estudiante: { id: string; nombre: string } | null; // null = ventana cerrada
  onCerrar: () => void;
}

// Boton pequeno para copiar un dato al portapapeles.
function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
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
      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#14848D]"
    >
      {copiado ? <Check className="h-4 w-4 text-[#14848D]" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// Datos de contacto directo de un estudiante asignado (SCRUM-51): correo y celular,
// con botones para escribirle por WhatsApp o por correo.
export function VentanaContactoEstudiante({ estudiante, onCerrar }: VentanaContactoEstudianteProps) {
  const perfil = usePerfil();
  const [contacto, setContacto] = useState<ContactoEstudiante | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estudiante) return;
    let activo = true;
    setContacto(null);
    setError(null);
    setCargando(true);
    obtenerContactoEstudiante(estudiante.id)
      .then((datos) => activo && setContacto(datos))
      .catch((err: Error) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [estudiante]);

  const nombre = contacto ? `${contacto.nombre} ${contacto.apellido}`.trim() : (estudiante?.nombre ?? "");
  const primerNombre = nombre.split(" ")[0];
  const saludo = `Hola ${primerNombre}, soy ${perfil.nombre}, tu docente de Lengua de Señas Colombiana en handsUp.`;

  return (
    <Ventana titulo="Contacto del estudiante" abierta={estudiante !== null} onCerrar={onCerrar}>
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
          Cargando el contacto...
        </div>
      ) : error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : contacto ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar nombre={nombre} url={contacto.avatar_url} tamano="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-800">{nombre}</p>
              <p className="text-xs text-slate-500">Estudiante de LSC</p>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="h-4 w-4 shrink-0 text-[#14848D]" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Correo</dt>
                <dd className="truncate text-sm font-semibold text-slate-800">{contacto.correo ?? "Sin correo"}</dd>
              </div>
              {contacto.correo && <BotonCopiar texto={contacto.correo} etiqueta="correo" />}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-[#14848D]" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Celular</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {contacto.telefono ? (
                    `+57 ${formatoTelefono(contacto.telefono)}`
                  ) : (
                    <span className="font-normal text-slate-500">Aún no ha registrado un celular.</span>
                  )}
                </dd>
              </div>
              {contacto.telefono && <BotonCopiar texto={contacto.telefono} etiqueta="celular" />}
            </div>
          </dl>

          <div className="grid gap-2">
            {contacto.telefono ? (
              <a
                href={enlaceWhatsApp(contacto.telefono, saludo)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#14848D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
              >
                <MessageCircle className="h-4 w-4" />
                Escribir por WhatsApp
              </a>
            ) : (
              <span className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-center text-xs text-slate-500">
                WhatsApp no disponible
              </span>
            )}
            {contacto.correo && (
              <a
                href={enlaceCorreo(contacto.correo, "Tu clase de LSC en handsUp", saludo)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" />
                Enviar correo
              </a>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[#14848D]" />
            Ves estos datos porque {primerNombre} tiene clases contigo. Úsalos solo para temas de tus clases.
          </p>
        </div>
      ) : null}
    </Ventana>
  );
}
