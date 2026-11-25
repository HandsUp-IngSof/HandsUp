import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, Loader2, SendHorizontal } from "lucide-react";

import { etiquetaDia, hora, mismoDia } from "@/componentes/chat/formatoChat";
import { Avatar } from "@/componentes/UI/Avatar";
import {
  abrirConversacion,
  enviarMensaje,
  escucharMensajes,
  marcarLeidos,
  MENSAJE_MAXIMO,
  obtenerMensajes,
  validarMensaje,
  type Chat,
  type Mensaje,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

interface VentanaChatProps {
  chat: Chat;
  yoId: string;
  onVolver: () => void; // en celular, vuelve a la lista
  onConversacionCreada: (otroId: string, conversacionId: string) => void;
  onActividad: () => void; // se envio o se leyo algo: refresca la lista
  aviso?: ReactNode; // nota debajo del chat (por ejemplo, el vaciado automatico)
}

// Agrega o reemplaza un mensaje sin duplicarlo (puede llegar por la respuesta y por tiempo real).
function conMensaje(lista: Mensaje[], mensaje: Mensaje): Mensaje[] {
  const i = lista.findIndex((m) => m.id === mensaje.id);
  if (i === -1) return [...lista, mensaje].sort((a, b) => a.creado_en.localeCompare(b.creado_en));
  const copia = [...lista];
  copia[i] = mensaje;
  return copia;
}

// Conversacion con una persona: mensajes en tiempo real y caja para escribir (SCRUM-44).
export function VentanaChat({ chat, yoId, onVolver, onConversacionCreada, onActividad, aviso }: VentanaChatProps) {
  const [conversacionId, setConversacionId] = useState(chat.conversacionId);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(Boolean(chat.conversacionId));
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const cajaRef = useRef<HTMLTextAreaElement>(null);

  const nombre = `${chat.nombre} ${chat.apellido}`.trim();
  const primerNombre = chat.nombre.split(" ")[0];

  // Carga los mensajes, los marca como leidos y escucha los nuevos en tiempo real.
  useEffect(() => {
    if (!conversacionId) return;
    let activo = true;
    setCargando(true);
    obtenerMensajes(conversacionId)
      .then((lista) => {
        if (!activo) return;
        setMensajes((actuales) => lista.reduce(conMensaje, actuales));
        marcarLeidos(conversacionId).then(onActividad);
      })
      .catch((err: Error) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));

    const dejarDeEscuchar = escucharMensajes((evento, mensaje) => {
      setMensajes((actuales) => conMensaje(actuales, mensaje));
      if (evento === "INSERT" && mensaje.autor_id !== yoId) marcarLeidos(conversacionId).then(onActividad);
    }, conversacionId);

    return () => {
      activo = false;
      dejarDeEscuchar();
    };
  }, [conversacionId, yoId, onActividad]);

  // Siempre muestra el ultimo mensaje.
  useEffect(() => {
    finalRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  useEffect(() => {
    cajaRef.current?.focus();
  }, []);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (enviando) return;
    const problema = validarMensaje(texto);
    if (problema) {
      setErrorEnvio(problema);
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      let id = conversacionId;
      if (!id) {
        id = await abrirConversacion(chat.otroId);
        setConversacionId(id);
        onConversacionCreada(chat.otroId, id);
      }
      const nuevo = await enviarMensaje(id, yoId, texto);
      setMensajes((actuales) => conMensaje(actuales, nuevo));
      setTexto("");
      onActividad();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
      cajaRef.current?.focus();
    }
  };

  // Enter envia; Shift + Enter hace un salto de linea.
  const alPresionarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    }
  };

  const ultimoMio = [...mensajes].reverse().find((m) => m.autor_id === yoId);
  const largo = texto.trim().length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Encabezado */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onVolver}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Volver a las conversaciones"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar nombre={nombre} url={chat.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-800">{nombre}</p>
          <p className="text-xs text-slate-500">{chat.rol === "profesor" ? "Docente de LSC" : "Estudiante de LSC"}</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F7F7] px-4 py-4" aria-live="polite">
        {cargando && mensajes.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
            Cargando mensajes...
          </div>
        ) : error ? (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : mensajes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar nombre={nombre} url={chat.avatarUrl} tamano="xl" />
            <p className="mt-3 font-bold text-slate-800">{nombre}</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">Escríbele a {primerNombre} para empezar la conversación.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {mensajes.map((m, i) => {
              const mio = m.autor_id === yoId;
              const nuevoDia = i === 0 || !mismoDia(mensajes[i - 1].creado_en, m.creado_en);
              return (
                <Fragment key={m.id}>
                  {nuevoDia && (
                    <p className="py-2 text-center">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                        {etiquetaDia(m.creado_en)}
                      </span>
                    </p>
                  )}
                  <div className={cn("flex", mio ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mio ? "rounded-br-md bg-[#14848D] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                      <p className={cn("mt-0.5 text-right text-[10px]", mio ? "text-white/75" : "text-slate-400")}>
                        {hora(m.creado_en)}
                      </p>
                    </div>
                  </div>
                  {mio && m.id === ultimoMio?.id && m.leido_en && (
                    <p className="pr-1 text-right text-[10px] font-semibold text-slate-400">Visto</p>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
        <div ref={finalRef} />
      </div>

      {/* Escribir */}
      <form onSubmit={enviar} className="border-t border-slate-200 bg-white px-3 py-3">
        {errorEnvio && (
          <p role="alert" className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errorEnvio}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="mensaje-nuevo" className="sr-only">
            Escribe un mensaje para {primerNombre}
          </label>
          <textarea
            id="mensaje-nuevo"
            ref={cajaRef}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErrorEnvio(null);
            }}
            onKeyDown={alPresionarTecla}
            rows={1}
            placeholder={`Escribe a ${primerNombre}...`}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#14848D] [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={enviando || largo === 0}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#14848D] text-white hover:bg-[#0F6E75] disabled:opacity-50"
            aria-label="Enviar mensaje"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>{aviso ?? "Enter para enviar · Shift + Enter para un salto de línea"}</span>
          {largo > MENSAJE_MAXIMO - 100 && (
            <span className={cn(largo > MENSAJE_MAXIMO && "font-bold text-red-600")}>
              {largo}/{MENSAJE_MAXIMO}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
