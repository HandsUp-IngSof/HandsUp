import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, LogOut, UserRound } from "lucide-react";

import { CambiarFotoPerfil } from "@/componentes/CambiarFotoPerfil";
import { Button } from "@/componentes/UI/Boton";
import { Avatar } from "@/componentes/UI/Avatar";
import { usePerfil } from "@/componentes/RutaProtegida";
import { cerrarSesion } from "@/lib/auth";

// Version inicial del panel: confirma el login, permite cambiar la foto de perfil (SCRUM-45)
// y lleva a "Mi perfil" para editar sus datos (SCRUM-47).
export function PanelEstudiante() {
  const perfil = usePerfil();
  const navigate = useNavigate();
  const [fotoAbierta, setFotoAbierta] = useState(false);
  const nombre = `${perfil.nombre} ${perfil.apellido}`.trim();

  const salir = async () => {
    await cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 font-['Fredoka',sans-serif]">
      <button
        type="button"
        onClick={() => setFotoAbierta(true)}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14848D] focus-visible:ring-offset-2"
        aria-label="Cambiar foto de perfil"
        title="Cambiar foto de perfil"
      >
        <Avatar nombre={nombre} url={perfil.avatar_url} tamano="xl" />
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14848D] text-white ring-2 ring-white transition-transform group-hover:scale-110">
          <Camera className="h-4 w-4" />
        </span>
      </button>
      <span className="text-xs font-bold uppercase tracking-wider text-[#D81B60]">Espacio estudiante</span>
      <h1 className="text-3xl font-bold text-slate-800">¡Hola, {perfil.nombre}!</h1>
      <p className="text-slate-500">Panel del estudiante en construcción.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          to="/estudiante/perfil"
          className="inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75]"
        >
          <UserRound className="h-4 w-4" />
          Editar perfil
        </Link>
        <Button variant="outline" size="sm" onClick={salir}>
          <LogOut />
          Cerrar sesión
        </Button>
      </div>

      <CambiarFotoPerfil abierta={fotoAbierta} onCerrar={() => setFotoAbierta(false)} />
    </main>
  );
}
