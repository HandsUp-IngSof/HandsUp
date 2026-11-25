import { useState, type ReactNode } from "react";

import { BarraLateral, type EnlaceMenu } from "@/componentes/layout/BarraLateral";
import { Encabezado, type OpcionMenu } from "@/componentes/layout/Encabezado";

interface PlantillaPanelProps {
  etiqueta: string;
  enlaces: EnlaceMenu[];
  titulo: string;
  subtitulo: string;
  nombre: string;
  rolTexto: string;
  avatarUrl?: string | null;
  rutaPerfil?: string;
  opcionesMenu?: OpcionMenu[];
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
  opcionesMenu,
  children,
}: PlantillaPanelProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F7F7] font-['Fredoka',sans-serif]">
      {/* Accesibilidad (SCRUM-28): con Tab, lo primero es saltar el menu e ir directo al contenido. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-[#14848D] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Saltar al contenido
      </a>
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
          opcionesMenu={opcionesMenu}
          onAbrirMenu={() => setMenuAbierto(true)}
        />
        <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
