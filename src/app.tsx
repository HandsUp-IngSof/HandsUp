import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "@/paginas/auth/Login";
import { Registro } from "@/paginas/auth/Registro";
import { PanelEstudiante } from "@/paginas/estudiante/Panel_estudiante";
import { PanelDocente } from "@/paginas/docente/Panel_docente";
import { RutaProtegida } from "@/componentes/RutaProtegida";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route
                    path="/estudiante"
                    element={
                        <RutaProtegida rol="estudiante">
                            <PanelEstudiante />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/docente"
                    element={
                        <RutaProtegida rol="profesor">
                            <PanelDocente />
                        </RutaProtegida>
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
