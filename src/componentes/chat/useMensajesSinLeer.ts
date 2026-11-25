import { useEffect, useState } from "react";

import { contarSinLeer, escucharMensajes, EVENTO_LEIDOS } from "@/lib/chat";

// Cantidad de mensajes sin leer, para el numero del menu "Mensajes" (SCRUM-44).
// Se actualiza sola cuando llega un mensaje nuevo o cuando se leen mensajes.
export function useMensajesSinLeer(): number {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    let activo = true;
    const actualizar = () => {
      contarSinLeer().then((n) => activo && setCantidad(n));
    };

    actualizar();
    const dejarDeEscuchar = escucharMensajes(actualizar);
    window.addEventListener(EVENTO_LEIDOS, actualizar);
    return () => {
      activo = false;
      dejarDeEscuchar();
      window.removeEventListener(EVENTO_LEIDOS, actualizar);
    };
  }, []);

  return cantidad;
}
