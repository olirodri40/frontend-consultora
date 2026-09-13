import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Agenda       from './pages/Agenda';
import Pacientes    from './pages/Pacientes';
import Zumba        from './pages/Zumba';
import Gerontologia from './pages/Gerontologia';
import Reportes     from './pages/Reportes';
import Admin        from './pages/Admin';
import SitioWeb     from './pages/SitioWeb';
import Notas        from './pages/Notas';
import Perfil       from './pages/Perfil';

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { estaLogueado } = useAuth();
  return estaLogueado ? <>{children}</> : <Navigate to="/login" replace />;
}

// Reportes/Admin/Sitio Web quedan reservados solo al administrador — ni
// siquiera el supervisor puede entrar escribiendo la URL directamente.
function RutaSoloAdministrador({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  return usuario?.rol === 'administrador' ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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
          <Route path="/notas"        element={<Notas />}        />
          <Route path="/perfil"       element={<Perfil />}       />
          <Route path="/reportes"     element={<RutaSoloAdministrador><Reportes /></RutaSoloAdministrador>}     />
          <Route path="/admin"        element={<RutaSoloAdministrador><Admin /></RutaSoloAdministrador>}        />
          <Route path="/sitio-web"    element={<RutaSoloAdministrador><SitioWeb /></RutaSoloAdministrador>}     />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;