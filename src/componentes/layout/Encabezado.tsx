import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, MoreHorizontal } from "lucide-react";

import { Avatar } from "@/componentes/UI/Avatar";
import { cerrarSesion } from "@/lib/auth";

interface EncabezadoProps {
  titulo: string;
  subtitulo: string;
  nombre: string;
  rolTexto: string;
  avatarUrl?: string | null;
  onAbrirMenu: () => void;
}

// Barra superior de los paneles: titulo, notificaciones, usuario y menu de opciones.
export function Encabezado({ titulo, subtitulo, nombre, rolTexto, avatarUrl, onAbrirMenu }: EncabezadoProps) {
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
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
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
