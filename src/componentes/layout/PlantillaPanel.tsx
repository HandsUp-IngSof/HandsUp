import { useState, type ReactNode } from "react";

import { BarraLateral, type EnlaceMenu } from "@/componentes/layout/BarraLateral";
import { Encabezado } from "@/componentes/layout/Encabezado";

interface PlantillaPanelProps {
  etiqueta: string;
  enlaces: EnlaceMenu[];
  titulo: string;
  subtitulo: string;
  nombre: string;
  rolTexto: string;
  avatarUrl?: string | null;
  rutaPerfil?: string;
  children: ReactNode;
}

// Estructura comun de los paneles (docente y estudiante): menu lateral, encabezado y contenido.
export function PlantillaPanel({
  etiqueta,
  enlaces,
  titulo,
  subtitulo,
  nombre,
  rolTexto,
  avatarUrl,
  rutaPerfil,
  children,
}: PlantillaPanelProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F7F7] font-['Fredoka',sans-serif]">
      <BarraLateral
        etiqueta={etiqueta}
        enlaces={enlaces}
        abierta={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Encabezado
          titulo={titulo}
          subtitulo={subtitulo}
          nombre={nombre}
          rolTexto={rolTexto}
          avatarUrl={avatarUrl}
          rutaPerfil={rutaPerfil}
          onAbrirMenu={() => setMenuAbierto(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
