import { useEffect, useState } from "react";

import { cn, iniciales } from "@/lib/utils";

const TAMANOS = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

interface AvatarProps {
  nombre: string;
  url?: string | null;
  tamano?: keyof typeof TAMANOS;
  className?: string;
}

// Foto de perfil redonda. Si no hay foto (o no carga), muestra las iniciales del nombre.
export function Avatar({ nombre, url, tamano = "md", className }: AvatarProps) {
  const [fallo, setFallo] = useState(false);

  // Si cambia la foto, se vuelve a intentar mostrarla.
  useEffect(() => setFallo(false), [url]);

  const base = cn("shrink-0 rounded-full", TAMANOS[tamano], className);

  if (url && !fallo) {
    return <img src={url} alt={`Foto de ${nombre}`} onError={() => setFallo(true)} className={cn(base, "object-cover")} />;
  }

  return (
    <span className={cn(base, "flex items-center justify-center bg-[#E7F3F3] font-bold text-[#14848D]")}>
      {iniciales(nombre)}
    </span>
  );
}
