import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Agenda      from './pages/Agenda';
import Pacientes   from './pages/Pacientes';
import Zumba       from './pages/Zumba';
import Gerontologia from './pages/Gerontologia';
import Reportes    from './pages/Reportes';

// Componente que protege rutas
// Si no hay sesion activa, redirige al login
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { estaLogueado } = useAuth();
  return estaLogueado ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta publica — solo el login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas — requieren sesion activa */}
        <Route element={
          <RutaProtegida>
            <MainLayout />
          </RutaProtegida>
        }>
          <Route path="/"             element={<Dashboard />}    />
          <Route path="/agenda"       element={<Agenda />}       />
          <Route path="/pacientes"    element={<Pacientes />}    />
          <Route path="/zumba"        element={<Zumba />}        />
          <Route path="/gerontologia" element={<Gerontologia />} />
          <Route path="/reportes"     element={<Reportes />}     />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;