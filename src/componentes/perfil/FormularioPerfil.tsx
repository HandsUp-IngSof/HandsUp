import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, Lock, Phone } from "lucide-react";

import { CambiarFotoPerfil } from "@/componentes/CambiarFotoPerfil";
import { useActualizarPerfil, usePerfil } from "@/componentes/RutaProtegida";
import { Avatar } from "@/componentes/UI/Avatar";
import { cn } from "@/lib/utils";
import {
  BIO_MAXIMO,
  formatoTelefono,
  guardarPerfil,
  normalizarPerfil,
  obtenerCamposPerfil,
  obtenerCorreo,
  validarPerfil,
  type DatosPerfil,
  type ErroresPerfil,
} from "@/lib/perfilUsuario";

interface CampoProps {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: ReactNode;
  children: ReactNode;
}

function Campo({ id, etiqueta, error, ayuda, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-slate-500">{ayuda}</p>
      )}
    </div>
  );
}

const claseCampo = (conError?: boolean) =>
  cn(
    "w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500",
    conError ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-[#14848D]",
  );

interface FormularioPerfilProps {
  rolTexto: string; // "Docente de LSC" o "Estudiante de LSC"
  conTelefono?: boolean; // el estudiante agrega su celular de contacto (SCRUM-47)
  ejemploBio?: string;
}

const VACIO: DatosPerfil = { nombre: "", apellido: "", bio: "", telefono: "" };

// Formulario "Mi perfil": foto, nombre, apellido y descripcion (SCRUM-48), mas el telefono
// del estudiante (SCRUM-47). El correo y el rol se muestran pero no se pueden cambiar.
export function FormularioPerfil({
  rolTexto,
  conTelefono = false,
  ejemploBio = "Ej: Docente de LSC con 5 años de experiencia en comunidades sordas.",
}: FormularioPerfilProps) {
  const perfil = usePerfil();
  const actualizarPerfil = useActualizarPerfil();

  const [original, setOriginal] = useState<DatosPerfil>(VACIO); // lo que esta guardado en Supabase
  const [datos, setDatos] = useState<DatosPerfil>(VACIO); // lo que esta escrito en el formulario
  const [correo, setCorreo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fotoAbierta, setFotoAbierta] = useState(false);

  useEffect(() => {
    let activo = true;
    const columnas = ["nombre", "apellido", "bio", ...(conTelefono ? ["telefono"] : [])];
    Promise.all([obtenerCamposPerfil(perfil.id, columnas), obtenerCorreo()])
      .then(([campos, email]) => {
        if (!activo) return;
        const cargados: DatosPerfil = {
          nombre: String(campos.nombre ?? ""),
          apellido: String(campos.apellido ?? ""),
          bio: String(campos.bio ?? ""),
          telefono: campos.telefono ? formatoTelefono(String(campos.telefono)) : "",
        };
        setOriginal(cargados);
        setDatos(cargados);
        setCorreo(email);
      })
      .catch((err: Error) => activo && setErrorCarga(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [perfil.id, conTelefono]);

  // El aviso de exito desaparece solo despues de unos segundos.
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const cambiar = (campo: keyof DatosPerfil) => (valor: string) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    setErrorGuardar(null);
  };

  const hayCambios = (Object.keys(datos) as (keyof DatosPerfil)[]).some(
    (campo) => datos[campo].trim() !== original[campo].trim(),
  );

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAviso(null);
    const encontrados = validarPerfil(datos, { conTelefono });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    const limpios = normalizarPerfil(datos, { conTelefono });
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarPerfil(perfil.id, limpios);
      const guardados: DatosPerfil = {
        nombre: limpios.nombre ?? "",
        apellido: limpios.apellido ?? "",
        bio: limpios.bio ?? "",
        telefono: limpios.telefono ? formatoTelefono(limpios.telefono) : "",
      };
      setOriginal(guardados);
      setDatos(guardados);
      // El nombre del encabezado y de las tarjetas cambia sin recargar la pagina.
      actualizarPerfil({ nombre: guardados.nombre, apellido: guardados.apellido });
      setAviso("Perfil actualizado.");
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : "No se pudo guardar tu perfil.");
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => {
    setDatos(original);
    setErrores({});
    setErrorGuardar(null);
  };

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`.trim();
  const largoBio = datos.bio.trim().length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
        Cargando tu perfil...
      </div>
    );
  }

  if (errorCarga) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {errorCarga}
      </p>
    );
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]"
    >
      {/* Foto */}
      <div className="flex flex-col items-center gap-3 text-center lg:border-r lg:border-slate-100 lg:pr-6">
        <button
          type="button"
          onClick={() => setFotoAbierta(true)}
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14848D] focus-visible:ring-offset-2"
          aria-label="Cambiar foto de perfil"
        >
          <Avatar nombre={nombreCompleto} url={perfil.avatar_url} tamano="xl" />
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14848D] text-white ring-2 ring-white transition-transform group-hover:scale-110">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <div>
          <p className="font-bold text-slate-800">{nombreCompleto}</p>
          <p className="text-xs text-slate-500">{rolTexto}</p>
        </div>
        <button
          type="button"
          onClick={() => setFotoAbierta(true)}
          className="text-xs font-bold text-[#14848D] hover:underline"
        >
          {perfil.avatar_url ? "Cambiar foto" : "Subir foto"}
        </button>
      </div>

      {/* Datos */}
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo id="perfil-nombre" etiqueta="Nombre" error={errores.nombre}>
            <input
              id="perfil-nombre"
              value={datos.nombre}
              onChange={(e) => cambiar("nombre")(e.target.value)}
              maxLength={60}
              autoComplete="given-name"
              aria-invalid={errores.nombre ? true : undefined}
              aria-describedby={errores.nombre ? "perfil-nombre-error" : undefined}
              className={cn(claseCampo(!!errores.nombre), "h-11")}
            />
          </Campo>
          <Campo id="perfil-apellido" etiqueta="Apellido" error={errores.apellido}>
            <input
              id="perfil-apellido"
              value={datos.apellido}
              onChange={(e) => cambiar("apellido")(e.target.value)}
              maxLength={60}
              autoComplete="family-name"
              aria-invalid={errores.apellido ? true : undefined}
              aria-describedby={errores.apellido ? "perfil-apellido-error" : undefined}
              className={cn(claseCampo(!!errores.apellido), "h-11")}
            />
          </Campo>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            id="perfil-correo"
            etiqueta="Correo electrónico"
            ayuda={
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Es tu usuario para iniciar sesión.
              </span>
            }
          >
            <input id="perfil-correo" value={correo ?? ""} disabled className={cn(claseCampo(), "h-11")} />
          </Campo>
          <Campo
            id="perfil-rol"
            etiqueta="Rol"
            ayuda={
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> El rol no se puede cambiar.
              </span>
            }
          >
            <input id="perfil-rol" value={rolTexto} disabled className={cn(claseCampo(), "h-11")} />
          </Campo>
        </div>

        {conTelefono && (
          <Campo
            id="perfil-telefono"
            etiqueta="Celular de contacto"
            error={errores.telefono}
            ayuda="Opcional. Solo lo verán los docentes con los que tengas clase."
          >
            <div className="relative sm:max-w-xs">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14848D]" />
              <input
                id="perfil-telefono"
                type="tel"
                inputMode="tel"
                value={datos.telefono}
                onChange={(e) => cambiar("telefono")(e.target.value)}
                maxLength={20}
                autoComplete="tel-national"
                placeholder="300 123 4567"
                aria-invalid={errores.telefono ? true : undefined}
                aria-describedby={errores.telefono ? "perfil-telefono-error" : undefined}
                className={cn(claseCampo(!!errores.telefono), "h-11 pl-9")}
              />
            </div>
          </Campo>
        )}

        <Campo
          id="perfil-bio"
          etiqueta="Sobre mí"
          error={errores.bio}
          ayuda="Cuéntale a tu comunidad quién eres y qué te motiva. Es opcional."
        >
          <textarea
            id="perfil-bio"
            value={datos.bio}
            onChange={(e) => cambiar("bio")(e.target.value)}
            rows={4}
            placeholder={ejemploBio}
            aria-invalid={errores.bio ? true : undefined}
            aria-describedby={errores.bio ? "perfil-bio-error" : undefined}
            className={cn(claseCampo(!!errores.bio), "resize-y py-2.5")}
          />
          <p className={cn("text-right text-xs", largoBio > BIO_MAXIMO ? "font-bold text-red-600" : "text-slate-400")}>
            {largoBio}/{BIO_MAXIMO}
          </p>
        </Campo>

        {errorGuardar && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {errorGuardar}
          </p>
        )}
        {aviso && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-[#E3F3F0] p-3 text-sm font-semibold text-[#0F6E75]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {aviso}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={descartar}
            disabled={!hayCambios || guardando}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Descartar cambios
          </button>
          <button
            type="submit"
            disabled={!hayCambios || guardando}
            className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <CambiarFotoPerfil abierta={fotoAbierta} onCerrar={() => setFotoAbierta(false)} />
    </form>
  );
}
