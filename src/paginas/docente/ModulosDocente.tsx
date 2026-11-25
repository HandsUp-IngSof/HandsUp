import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { Ventana } from "@/componentes/UI/Ventana";
import { iconoDeModulo } from "@/lib/iconos";
import { cn } from "@/lib/utils";
import {
  actualizarLeccion,
  actualizarModulo,
  crearLeccion,
  crearModulo,
  eliminarLeccion,
  eliminarModulo,
  guardarOrden,
  obtenerModulosDocente,
  publicarLeccion,
  publicarModulo,
  type DatosLeccion,
  type DatosModulo,
  type LeccionDocente,
  type ModuloDocente,
} from "@/paginas/docente/modulosDocente";
import { VentanaLeccionDocente, VentanaModulo } from "@/paginas/docente/secciones/VentanasModulos";

// Que ventana de formulario esta abierta.
type EdicionModulo = { modulo: ModuloDocente | null } | null; // modulo null = nuevo
type EdicionLeccion = { modulo: ModuloDocente; leccion: LeccionDocente | null } | null; // leccion null = nueva
type Eliminacion = { tipo: "modulo" | "leccion"; id: string; nombre: string } | null;

// Mueve un elemento una posicion arriba (-1) o abajo (+1) y devuelve los ids en el nuevo orden.
function idsMovidos<T extends { id: string }>(lista: T[], indice: number, paso: -1 | 1): string[] {
  const ids = lista.map((e) => e.id);
  [ids[indice], ids[indice + paso]] = [ids[indice + paso], ids[indice]];
  return ids;
}

function Insignia({ publicado }: { publicado: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        publicado ? "bg-[#E3F3F0] text-[#14848D]" : "bg-amber-100 text-amber-800",
      )}
    >
      {publicado ? "Publicado" : "Borrador"}
    </span>
  );
}

function BotonIcono({
  titulo,
  onClick,
  disabled,
  peligro,
  children,
}: {
  titulo: string;
  onClick: () => void;
  disabled?: boolean;
  peligro?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
        peligro ? "hover:text-red-600" : "hover:text-[#14848D]",
      )}
    >
      {children}
    </button>
  );
}

// "Mis módulos" del docente (SCRUM-33): disena y modifica los modulos y lecciones
// que despues ven los estudiantes en su panel.
export function ModulosDocente() {
  const perfil = usePerfil();
  const [modulos, setModulos] = useState<ModuloDocente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);

  const [edicionModulo, setEdicionModulo] = useState<EdicionModulo>(null);
  const [edicionLeccion, setEdicionLeccion] = useState<EdicionLeccion>(null);
  const [eliminacion, setEliminacion] = useState<Eliminacion>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setModulos(await obtenerModulosDocente(perfil.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus módulos.");
    } finally {
      setCargando(false);
    }
  }, [perfil.id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // Ejecuta un cambio y recarga la lista. Los errores se muestran arriba.
  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true);
    setAviso(null);
    try {
      await accion();
      await recargar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  };

  const alternar = (id: string) =>
    setExpandidos((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  // Datos iniciales de los formularios. Con useMemo no cambian en cada render,
  // para que el formulario no se reinicie mientras el docente escribe.
  const inicialModulo = useMemo<DatosModulo | null>(() => {
    const m = edicionModulo?.modulo;
    if (!m) return null;
    return {
      titulo: m.titulo,
      descripcion: m.descripcion,
      icono: m.icono,
      requiereClaseBienvenida: m.requiereClaseBienvenida,
      duracionMin: m.duracionMin ? String(m.duracionMin) : "",
    };
  }, [edicionModulo]);

  const inicialLeccion = useMemo<DatosLeccion | null>(() => {
    const l = edicionLeccion?.leccion;
    if (!l) return null;
    return { titulo: l.titulo, descripcion: l.descripcion, contenido: l.contenido, videoUrl: l.videoUrl };
  }, [edicionLeccion]);

  const cerrarModulo = useCallback(() => setEdicionModulo(null), []);
  const cerrarLeccion = useCallback(() => setEdicionLeccion(null), []);
  const cerrarEliminar = useCallback(() => {
    setEliminacion(null);
    setErrorEliminar(null);
  }, []);

  const guardarModulo = async (datos: DatosModulo) => {
    if (!edicionModulo) return;
    if (edicionModulo.modulo) await actualizarModulo(edicionModulo.modulo.id, datos);
    else await crearModulo(perfil.id, datos, Math.max(0, ...modulos.map((m) => m.orden)));
    setEdicionModulo(null);
    await recargar();
  };

  const guardarLeccion = async (datos: DatosLeccion) => {
    if (!edicionLeccion) return;
    const { modulo, leccion } = edicionLeccion;
    if (leccion) await actualizarLeccion(leccion.id, datos);
    else {
      await crearLeccion(perfil.id, modulo.id, datos, Math.max(0, ...modulo.lecciones.map((l) => l.orden)));
      setExpandidos((actual) => new Set(actual).add(modulo.id));
    }
    setEdicionLeccion(null);
    await recargar();
  };

  const confirmarEliminar = async () => {
    if (!eliminacion) return;
    setOcupado(true);
    setErrorEliminar(null);
    try {
      if (eliminacion.tipo === "modulo") await eliminarModulo(eliminacion.id);
      else await eliminarLeccion(eliminacion.id);
      cerrarEliminar();
      await recargar();
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoSeccion
        titulo="Mis módulos"
        descripcion="Diseña los módulos y las lecciones que tus estudiantes ven en su ruta de aprendizaje."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Los módulos nuevos empiezan como <strong>borrador</strong>. Publícalos para que tus estudiantes los vean.
        </p>
        <button
          type="button"
          onClick={() => setEdicionModulo({ modulo: null })}
          className="flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
        >
          <Plus className="h-4 w-4" />
          Nuevo módulo
        </button>
      </div>

      {aviso && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
          Cargando tus módulos...
        </div>
      ) : error ? (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : modulos.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-bold text-slate-800">Aún no has creado módulos</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Crea tu primer módulo y añade sus lecciones con videos y contenido.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {modulos.map((modulo, indice) => {
            const Icono = iconoDeModulo(modulo.icono);
            const abierto = expandidos.has(modulo.id);
            const publicadas = modulo.lecciones.filter((l) => l.publicada).length;
            return (
              <li key={modulo.id} className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => alternar(modulo.id)}
                    aria-expanded={abierto}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F3F3] text-[#14848D]">
                      <Icono className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-bold text-slate-800">
                          M{String(indice + 1).padStart(2, "0")} · {modulo.titulo}
                        </span>
                        <Insignia publicado={modulo.publicado} />
                        {modulo.requiereClaseBienvenida && (
                          <span className="flex items-center gap-1 rounded-full bg-[#FCE4EF] px-2.5 py-0.5 text-[11px] font-bold text-[#B5246E]">
                            <Video className="h-3 w-3" />
                            En vivo
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {modulo.lecciones.length} {modulo.lecciones.length === 1 ? "lección" : "lecciones"}
                        {modulo.lecciones.length > 0 && ` · ${publicadas} publicadas`}
                        {modulo.duracionMin ? ` · ${modulo.duracionMin} min` : ""}
                      </span>
                    </span>
                    {abierto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  <div className="flex items-center">
                    <BotonIcono
                      titulo="Subir módulo"
                      disabled={ocupado || indice === 0}
                      onClick={() => void ejecutar(() => guardarOrden("modulos", idsMovidos(modulos, indice, -1)))}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </BotonIcono>
                    <BotonIcono
                      titulo="Bajar módulo"
                      disabled={ocupado || indice === modulos.length - 1}
                      onClick={() => void ejecutar(() => guardarOrden("modulos", idsMovidos(modulos, indice, 1)))}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </BotonIcono>
                    <BotonIcono
                      titulo={modulo.publicado ? "Ocultar a los estudiantes" : "Publicar para los estudiantes"}
                      disabled={ocupado}
                      onClick={() => void ejecutar(() => publicarModulo(modulo.id, !modulo.publicado))}
                    >
                      {modulo.publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </BotonIcono>
                    <BotonIcono titulo="Editar módulo" onClick={() => setEdicionModulo({ modulo })}>
                      <Pencil className="h-4 w-4" />
                    </BotonIcono>
                    <BotonIcono
                      titulo="Eliminar módulo"
                      peligro
                      onClick={() => setEliminacion({ tipo: "modulo", id: modulo.id, nombre: modulo.titulo })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </BotonIcono>
                  </div>
                </div>

                {abierto && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                    {modulo.descripcion && <p className="mb-3 text-sm text-slate-600">{modulo.descripcion}</p>}

                    {modulo.lecciones.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                        Este módulo todavía no tiene lecciones.
                      </p>
                    ) : (
                      <ol className="space-y-2">
                        {modulo.lecciones.map((leccion, i) => (
                          <li key={leccion.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F3F3] text-xs font-bold text-[#14848D]">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                                <span className="truncate">{leccion.titulo}</span>
                                <Insignia publicado={leccion.publicada} />
                                {leccion.videoUrl && <Video className="h-3.5 w-3.5 text-[#14848D]" aria-label="Tiene video" />}
                              </p>
                              {leccion.descripcion && <p className="truncate text-xs text-slate-500">{leccion.descripcion}</p>}
                            </div>
                            <div className="flex items-center">
                              <BotonIcono
                                titulo="Subir lección"
                                disabled={ocupado || i === 0}
                                onClick={() => void ejecutar(() => guardarOrden("lecciones", idsMovidos(modulo.lecciones, i, -1)))}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </BotonIcono>
                              <BotonIcono
                                titulo="Bajar lección"
                                disabled={ocupado || i === modulo.lecciones.length - 1}
                                onClick={() => void ejecutar(() => guardarOrden("lecciones", idsMovidos(modulo.lecciones, i, 1)))}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </BotonIcono>
                              <BotonIcono
                                titulo={leccion.publicada ? "Ocultar lección" : "Publicar lección"}
                                disabled={ocupado}
                                onClick={() => void ejecutar(() => publicarLeccion(leccion.id, !leccion.publicada))}
                              >
                                {leccion.publicada ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </BotonIcono>
                              <BotonIcono titulo="Editar lección" onClick={() => setEdicionLeccion({ modulo, leccion })}>
                                <Pencil className="h-4 w-4" />
                              </BotonIcono>
                              <BotonIcono
                                titulo="Eliminar lección"
                                peligro
                                onClick={() => setEliminacion({ tipo: "leccion", id: leccion.id, nombre: leccion.titulo })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </BotonIcono>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    <button
                      type="button"
                      onClick={() => setEdicionLeccion({ modulo, leccion: null })}
                      className="mt-3 flex items-center gap-2 rounded-xl border border-[#14848D] px-4 py-2 text-sm font-bold text-[#14848D] hover:bg-[#E3F3F0]"
                    >
                      <Plus className="h-4 w-4" />
                      Añadir lección
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <VentanaModulo
        abierta={edicionModulo !== null}
        inicial={inicialModulo}
        onCerrar={cerrarModulo}
        onGuardar={guardarModulo}
      />

      <VentanaLeccionDocente
        abierta={edicionLeccion !== null}
        inicial={inicialLeccion}
        onCerrar={cerrarLeccion}
        onGuardar={guardarLeccion}
      />

      <Ventana
        titulo={eliminacion?.tipo === "modulo" ? "Eliminar módulo" : "Eliminar lección"}
        abierta={eliminacion !== null}
        onCerrar={cerrarEliminar}
      >
        {eliminacion && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              ¿Seguro que quieres eliminar {eliminacion.tipo === "modulo" ? "el módulo" : "la lección"}{" "}
              <strong>{eliminacion.nombre}</strong>?
              {eliminacion.tipo === "modulo" && " También se eliminarán todas sus lecciones."} Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorEliminar}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarEliminar}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEliminar()}
                disabled={ocupado}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </Ventana>
    </div>
  );
}
