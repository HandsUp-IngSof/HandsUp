import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "@/componentes/UI/Boton";
import { usePerfil } from "@/componentes/RutaProtegida";
import { cerrarSesion } from "@/lib/auth";

// Version inicial del panel: solo confirma que el login y la proteccion por rol funcionan.
export function PanelEstudiante() {
  const perfil = usePerfil();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 font-['Fredoka',sans-serif]">
      <span className="text-xs font-bold uppercase tracking-wider text-[#D81B60]">Espacio estudiante</span>
      <h1 className="text-3xl font-bold text-slate-800">¡Hola, {perfil.nombre}!</h1>
      <p className="text-slate-500">Panel del estudiante en construcción.</p>
      <Button variant="outline" size="sm" onClick={salir}>
        <LogOut />
        Cerrar sesión
      </Button>
    </main>
  );
}
