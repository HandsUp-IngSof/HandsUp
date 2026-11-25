import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Clock3, Loader2, MessagesSquare } from "lucide-react";

import { fechaCorta } from "@/componentes/chat/formatoChat";
import { VentanaChat } from "@/componentes/chat/VentanaChat";
import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { usePerfil } from "@/componentes/RutaProtegida";
import { Avatar } from "@/componentes/UI/Avatar";
import { DIAS_RETENCION, escucharMensajes, EVENTO_LEIDOS, obtenerChats, type Chat } from "@/lib/chat";
import { cn } from "@/lib/utils";

interface PaginaMensajesProps {
  descripcion: string;
  sinContactos: string; // texto cuando todavia no tiene con quien hablar
  aviso?: ReactNode;
}

// Pagina "Mensajes" de los dos paneles (SCRUM-44): lista de conversaciones a la izquierda
// y el chat a la derecha. En celular se ve una cosa a la vez.
// ?con=<id> abre directamente el chat con esa persona.
export function PaginaMensajes({
  descripcion,
  sinContactos,
  // Vaciado automatico (SCRUM-52): se avisa debajo de la caja de escribir.
  aviso = (
    <span className="flex items-center gap-1">
      <Clock3 className="h-3 w-3" />
      Los mensajes se borran solos después de {DIAS_RETENCION} días.
    </span>
  ),
}: PaginaMensajesProps) {
  const perfil = usePerfil();
  const [parametros, setParametros] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(() => {
    obtenerChats()
      .then((lista) => {
        setChats(lista);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  // Carga la lista y la mantiene al dia con los mensajes que llegan.
  useEffect(() => {
    recargar();
    const dejarDeEscuchar = escucharMensajes((evento) => evento === "INSERT" && recargar());
    window.addEventListener(EVENTO_LEIDOS, recargar);
    return () => {
      dejarDeEscuchar();
      window.removeEventListener(EVENTO_LEIDOS, recargar);
    };
  }, [recargar]);

  const elegidoId = parametros.get("con");
  const elegido = chats.find((c) => c.otroId === elegidoId) ?? null;

  const elegir = (otroId: string | null) => setParametros(otroId ? { con: otroId } : {});

  const conversacionCreada = useCallback((otroId: string, conversacionId: string) => {
    setChats((lista) => lista.map((c) => (c.otroId === otroId ? { ...c, conversacionId } : c)));
  }, []);

  return (
    <>
      <EncabezadoSeccion titulo="Mensajes" descripcion={descripcion} />

      <div className="grid h-[calc(100dvh-14rem)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[300px_minmax(0,1fr)]">
        {/* Lista de conversaciones */}
        <aside className={cn("flex min-h-0 flex-col md:border-r md:border-slate-200", elegido && "hidden md:flex")}>
          <p className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Conversaciones</p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cargando ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
                Cargando...
              </div>
            ) : error ? (
              <p className="m-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : chats.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">{sinContactos}</p>
            ) : (
              <ul>
                {chats.map((c) => {
                  const nombre = `${c.nombre} ${c.apellido}`.trim();
                  const activo = c.otroId === elegidoId;
                  const vista = c.ultimoTexto
                    ? `${c.ultimoAutorId === perfil.id ? "Tú: " : ""}${c.ultimoTexto}`
                    : "Escríbele para empezar";
                  return (
                    <li key={c.otroId}>
                      <button
                        type="button"
                        onClick={() => elegir(c.otroId)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          activo ? "bg-[#E7F3F3]" : "hover:bg-slate-50",
                        )}
                      >
                        <Avatar nombre={nombre} url={c.avatarUrl} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={cn("truncate text-sm text-slate-800", c.sinLeer > 0 ? "font-bold" : "font-semibold")}>
                              {nombre}
                            </span>
                            {c.ultimoEn && <span className="shrink-0 text-[11px] text-slate-400">{fechaCorta(c.ultimoEn)}</span>}
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-xs",
                                c.sinLeer > 0 ? "font-semibold text-slate-700" : c.ultimoTexto ? "text-slate-500" : "italic text-slate-400",
                              )}
                            >
                              {vista}
                            </span>
                            {c.sinLeer > 0 && (
                              <span className="shrink-0 rounded-full bg-[#B5246E] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {c.sinLeer}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Chat elegido */}
        <section className={cn("min-h-0", !elegido && "hidden md:block")}>
          {elegido ? (
            <VentanaChat
              key={elegido.otroId}
              chat={elegido}
              yoId={perfil.id}
              onVolver={() => elegir(null)}
              onConversacionCreada={conversacionCreada}
              onActividad={recargar}
              aviso={aviso}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F3F3] text-[#14848D]">
                <MessagesSquare className="h-7 w-7" />
              </span>
              <p className="mt-3 font-bold text-slate-800">Elige una conversación</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Los mensajes nuevos llegan solos, sin recargar la página.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
