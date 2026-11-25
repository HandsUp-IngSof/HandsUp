import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarPlus,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";

import { usePerfil } from "@/componentes/RutaProtegida";
import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { Avatar } from "@/componentes/UI/Avatar";
import { BotonCopiar } from "@/componentes/UI/BotonCopiar";
import { formatoTelefono } from "@/lib/perfilUsuario";
import { enlaceCorreo, enlaceWhatsApp } from "@/paginas/docente/contactoEstudiante";
import { nombrePlataforma } from "@/paginas/docente/enlaceClase";
import { obtenerMisDocentes, type ContactoDocente } from "@/paginas/estudiante/consultasContactoDocente";

function TarjetaDocente({ docente, nombreEstudiante }: { docente: ContactoDocente; nombreEstudiante: string }) {
  const nombre = `${docente.nombre} ${docente.apellido}`.trim();
  const saludo = `Hola ${docente.nombre}, soy ${nombreEstudiante}, tu estudiante de Lengua de Señas Colombiana en handsUp.`;
  const plataforma = docente.enlaceClase ? nombrePlataforma(docente.enlaceClase) : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Avatar nombre={nombre} url={docente.avatarUrl} tamano="xl" />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-slate-800">{nombre}</h2>
          <p className="text-xs text-slate-500">Docente de LSC</p>
        </div>
      </div>

      {docente.bio && <p className="mt-4 text-sm text-slate-600">{docente.bio}</p>}

      <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <Mail className="h-4 w-4 shrink-0 text-[#14848D]" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-slate-500">Correo</dt>
            <dd className="truncate text-sm font-semibold text-slate-800">{docente.correo ?? "Sin correo"}</dd>
          </div>
          {docente.correo && <BotonCopiar texto={docente.correo} etiqueta="correo" />}
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Phone className="h-4 w-4 shrink-0 text-[#14848D]" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-slate-500">Celular</dt>
            <dd className="text-sm font-semibold text-slate-800">
              {docente.telefono ? (
                `+57 ${formatoTelefono(docente.telefono)}`
              ) : (
                <span className="font-normal text-slate-500">Tu docente aún no ha registrado un celular.</span>
              )}
            </dd>
          </div>
          {docente.telefono && <BotonCopiar texto={docente.telefono} etiqueta="celular" />}
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Video className="h-4 w-4 shrink-0 text-[#14848D]" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-slate-500">Enlace de la clase{plataforma ? ` · ${plataforma}` : ""}</dt>
            <dd className="truncate text-sm font-semibold text-slate-800">
              {docente.enlaceClase ?? <span className="font-normal text-slate-500">Aún no ha publicado su enlace.</span>}
            </dd>
          </div>
          {docente.enlaceClase && <BotonCopiar texto={docente.enlaceClase} etiqueta="enlace" />}
        </div>
      </dl>

      {/* Chat dentro de handsUp (SCRUM-44), igual que en el contacto del estudiante (SCRUM-51) */}
      <Link
        to={`/estudiante/mensajes?con=${docente.id}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#B5246E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#9A1F5E]"
      >
        <MessagesSquare className="h-4 w-4" />
        Enviar mensaje en handsUp
      </Link>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {docente.telefono ? (
          <a
            href={enlaceWhatsApp(docente.telefono, saludo)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#14848D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <span className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-center text-xs text-slate-500">
            WhatsApp no disponible
          </span>
        )}
        {docente.correo ? (
          <a
            href={enlaceCorreo(docente.correo, "Mi clase de LSC en handsUp", saludo)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Enviar correo
          </a>
        ) : (
          <span className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-center text-xs text-slate-500">
            Correo no disponible
          </span>
        )}
        {docente.enlaceClase ? (
          <a
            href={docente.enlaceClase}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            Ir a la clase
          </a>
        ) : null}
      </div>
    </article>
  );
}

// "Mi docente" (SCRUM-50): datos de contacto directo de los docentes con los que el estudiante tiene clases.
export function ContactoDocentePagina() {
  const perfil = usePerfil();
  const [docentes, setDocentes] = useState<ContactoDocente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerMisDocentes()
      .then((lista) => activo && setDocentes(lista))
      .catch((err: Error) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoSeccion
        titulo="Contactar al docente"
        descripcion="Escríbele a tu docente por el chat de handsUp, WhatsApp o correo para resolver dudas de tus clases."
      />

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
          Cargando el contacto de tu docente...
        </div>
      ) : error ? (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : docentes.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE4EF] text-[#B5246E]">
            <MessageCircle className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-800">Aún no tienes un docente asignado</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Tu docente es quien da la clase que agendas. Reserva tu primera clase y sus datos de contacto aparecerán aquí.
          </p>
          <Link
            to="/estudiante/clases"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
          >
            <CalendarPlus className="h-4 w-4" />
            Agendar una clase
          </Link>
        </section>
      ) : (
        <div className="space-y-5">
          {docentes.map((docente) => (
            <TarjetaDocente key={docente.id} docente={docente} nombreEstudiante={perfil.nombre} />
          ))}
          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[#14848D]" />
            Ves estos datos porque tienes clases con tu docente. Úsalos solo para temas de tus clases.
          </p>
        </div>
      )}
    </div>
  );
}
