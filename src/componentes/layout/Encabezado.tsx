import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Bell, LogOut, Menu, MoreHorizontal, UserRound } from "lucide-react";

import { Avatar } from "@/componentes/UI/Avatar";
import { cerrarSesion } from "@/lib/auth";

// Opcion extra del menu "···". Sin ruta se muestra como "Pronto" (aun no implementada).
export interface OpcionMenu {
  texto: string;
  icono: LucideIcon;
  ruta?: string;
}

interface EncabezadoProps {
  titulo: string;
  subtitulo: string;
  nombre: string;
  rolTexto: string;
  avatarUrl?: string | null;
  rutaPerfil?: string; // pagina "Mi perfil" (SCRUM-48)
  // Seccion "Tu espacio personal" del menu "···" del estudiante (SCRUM-58).
  opcionesMenu?: OpcionMenu[];
  onAbrirMenu: () => void;
}

// Barra superior de los paneles: titulo, notificaciones, usuario y menu de opciones.
export function Encabezado({
  titulo,
  subtitulo,
  nombre,
  rolTexto,
  avatarUrl,
  rutaPerfil,
  opcionesMenu,
  onAbrirMenu,
}: EncabezadoProps) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el menu de opciones al hacer clic fuera de el.
  useEffect(() => {
    if (!menuAbierto) return;
    const alHacerClic = (evento: MouseEvent) => {
      if (!menuRef.current?.contains(evento.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", alHacerClic);
    return () => document.removeEventListener("mousedown", alHacerClic);
  }, [menuAbierto]);

  const salir = async () => {
    await cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onAbrirMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-slate-800">{titulo}</p>
        <p className="truncate text-xs text-slate-500">{subtitulo}</p>
      </div>

      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notificaciones"
        title="Próximamente"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <Avatar nombre={nombre} url={avatarUrl} />
        <div className="hidden sm:block">
          <p className="text-sm font-bold leading-tight text-slate-800">{nombre}</p>
          <p className="text-xs text-slate-500">{rolTexto}</p>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          aria-label="Más opciones"
          aria-expanded={menuAbierto}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuAbierto && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {opcionesMenu && opcionesMenu.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tu espacio personal
                </p>
                {opcionesMenu.map(({ texto, icono: Icono, ruta }) =>
                  ruta ? (
                    <Link
                      key={texto}
                      to={ruta}
                      onClick={() => setMenuAbierto(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#E7F3F3]"
                    >
                      <Icono className="h-4 w-4 text-[#14848D]" />
                      {texto}
                    </Link>
                  ) : (
                    <span
                      key={texto}
                      title="Próximamente"
                      className="flex w-full cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400"
                    >
                      <Icono className="h-4 w-4" />
                      <span className="flex-1">{texto}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold">Pronto</span>
                    </span>
                  ),
                )}
                <div className="my-1 border-t border-slate-100" />
              </>
            )}
            {rutaPerfil && (
              <Link
                to={rutaPerfil}
                onClick={() => setMenuAbierto(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" />
                Mi perfil
              </Link>
            )}
            <button
              type="button"
              onClick={salir}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
