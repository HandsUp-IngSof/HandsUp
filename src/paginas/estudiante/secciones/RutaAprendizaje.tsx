import { ArrowRight, BookOpen, Flag, Info, Lightbulb, Lock, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Modulo } from "@/paginas/estudiante/datosEjemplo";

// Los modulos disponibles alternan verde y rosado, como en la maqueta.
const esVerde = (indice: number) => indice % 2 === 0;

function TarjetaModulo({ modulo, indice }: { modulo: Modulo; indice: number }) {
  const { estado, icono: Icono } = modulo;
  const bloqueado = estado === "bloqueado";
  const enCurso = estado === "en_curso";

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm",
        enCurso ? "border-2 border-[#B5246E]/70" : "border border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            enCurso || (!bloqueado && !esVerde(indice)) ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-[#E7F3F3] text-[#14848D]",
          )}
        >
          <Icono className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-right text-[10px] font-bold tracking-wide",
            bloqueado ? "text-slate-500" : enCurso ? "text-[#B5246E]" : "text-[#14848D]",
          )}
        >
          {bloqueado && <Lock className="h-3 w-3" />}
          {modulo.etiqueta}
        </span>
      </div>

      <h3 className="mt-3 font-bold text-slate-800">{modulo.titulo}</h3>
      <p className="mt-1 text-xs text-slate-500">{modulo.descripcion}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        {bloqueado ? <Info className="h-3.5 w-3.5 shrink-0" /> : <BookOpen className="h-3.5 w-3.5 shrink-0" />}
        {modulo.detalle}
      </p>

      {bloqueado ? (
        <span className="mt-4 block rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
          Pendiente de bienvenida
        </span>
      ) : (
        <button
          type="button"
          title="Próximamente"
          className={cn(
            "mt-4 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold",
            enCurso ? "bg-[#14848D] text-white hover:bg-[#0F6E75]" : "bg-[#E3F3F0] text-[#14848D] hover:bg-[#D3ECE8]",
          )}
        >
          {enCurso ? "Continuar módulo" : "Explorar módulo"}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}

// Circulo del camino central con el codigo del modulo.
function Nodo({ modulo, indice }: { modulo: Modulo; indice: number }) {
  const { estado, icono: Icono } = modulo;

  if (estado === "en_curso") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B5246E] text-white ring-4 ring-[#FCE4EF]">
          <Icono className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-[#B5246E] px-2 py-0.5 text-[9px] font-bold text-white">EN CURSO</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white",
          estado === "bloqueado"
            ? "border-slate-300 text-slate-400"
            : esVerde(indice)
              ? "border-[#14848D] text-[#14848D]"
              : "border-[#B5246E] text-[#B5246E]",
        )}
      >
        {estado === "bloqueado" ? <Lock className="h-4 w-4" /> : <Icono className="h-5 w-5" />}
      </span>
      <span className="text-[10px] font-bold text-slate-400">{modulo.codigo}</span>
    </div>
  );
}

// "Tu ruta de aprendizaje": modulos del nivel con su estado (SCRUM-58; datos reales en SCRUM-33).
// En pantallas grandes los modulos van en zigzag alrededor de un camino; en celular, uno debajo del otro.
export function RutaAprendizaje({ modulos }: { modulos: Modulo[] }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tu ruta de aprendizaje</h2>
          <p className="text-xs text-slate-500">Nivel inicial · Aprende, practica y conecta.</p>
        </div>
        <span className="rounded-full bg-[#E3F3F0] px-3 py-1 text-xs font-bold text-[#14848D]">
          {modulos.length} módulos
        </span>
      </div>

      {/* Escritorio: zigzag con camino central */}
      <div className="relative mt-4 hidden md:block">
        <div className="absolute bottom-6 left-1/2 top-4 -translate-x-1/2 border-l-2 border-dashed border-slate-300" />

        <div className="relative flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-[#14848D] px-3 py-1 text-[10px] font-bold text-white">
            <Star className="h-3 w-3" />
            INICIO
          </span>
        </div>

        {modulos.map((modulo, indice) => {
          const izquierda = indice % 2 === 0;
          return (
            <div
              key={modulo.codigo}
              className={cn("relative grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] items-start", indice === 0 ? "mt-3" : "-mt-14")}
            >
              <div>{izquierda && <TarjetaModulo modulo={modulo} indice={indice} />}</div>
              <div className="flex justify-center pt-10">
                <Nodo modulo={modulo} indice={indice} />
              </div>
              <div>{!izquierda && <TarjetaModulo modulo={modulo} indice={indice} />}</div>
            </div>
          );
        })}

        <div className="relative mt-4 flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-400">
            <Flag className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Celular: lista */}
      <div className="mt-4 space-y-4 md:hidden">
        {modulos.map((modulo, indice) => (
          <TarjetaModulo key={modulo.codigo} modulo={modulo} indice={indice} />
        ))}
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <Lightbulb className="h-4 w-4 shrink-0 text-[#B5246E]" />
        Aprender LSC también es conocer y valorar a la comunidad sorda.
      </p>
    </section>
  );
}
