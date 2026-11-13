import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "@/paginas/auth/Login";
import { Registro } from "@/paginas/auth/Registro";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
