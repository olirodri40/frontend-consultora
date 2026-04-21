import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard    from './pages/Dashboard';
import Agenda       from './pages/Agenda';
import Pacientes    from './pages/Pacientes';
import Zumba        from './pages/Zumba';
import Gerontologia from './pages/Gerontologia';
import Reportes     from './pages/Reportes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todas las rutas usan MainLayout (sidebar + contenido) */}
        <Route element={<MainLayout />}>
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