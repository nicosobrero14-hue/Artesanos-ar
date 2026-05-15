import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Panel from './pages/Panel'
import MisPiezas from './pages/MisPiezas'
import MisPedidos from './pages/MisPedidos'
import MisMensajes from './pages/MisMensajes'
import MiPerfil from './pages/MiPerfil'
import CatalogoPublico from './pages/CatalogoPublico'
import PiezaDetalle from './pages/PiezaDetalle'
import Premium from './pages/Premium'
import Ranking from './pages/Ranking'
import Eventos from './pages/Eventos'
import MisEventos from './pages/MisEventos'
import AdminEventos from './pages/AdminEventos'
import Admin from './pages/Admin'
import AdminReportes from './pages/AdminReportes'
import AdminAuditoria from './pages/AdminAuditoria'
import RecuperarPassword from './pages/RecuperarPassword'
import Buscar from './pages/Buscar'
import Favoritos from './pages/Favoritos'
import MisCupones from './pages/MisCupones'
import StatsAvanzadas from './pages/StatsAvanzadas'
import Chat from './pages/Chat'
import Legal from './pages/Legal'
import RutaProtegida from './components/RutaProtegida'
import Inicio from './pages/Inicio'
import Verificar from './pages/Verificar'
import MisClientes from './pages/MisClientes'
import NotFound from './pages/NotFound'
import AdminPiezas from './pages/AdminPiezas'
import AdminFeedback from './pages/AdminFeedback'
import AdminRanking from './pages/AdminRanking'
import BotonFeedback from './components/BotonFeedback'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/artesano/:slug" element={<CatalogoPublico />} />
        <Route path="/artesano/:slug/pieza/:id" element={<PiezaDetalle />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/terminos" element={<Legal />} />
        <Route path="/privacidad" element={<Legal />} />
        <Route path="/favoritos" element={<RutaProtegida><Favoritos /></RutaProtegida>} />
        <Route path="/panel/eventos" element={<RutaProtegida><MisEventos /></RutaProtegida>} />
        <Route path="/panel/cupones" element={<RutaProtegida><MisCupones /></RutaProtegida>} />
        <Route path="/panel/stats" element={<RutaProtegida><StatsAvanzadas /></RutaProtegida>} />
        <Route path="/chat" element={<RutaProtegida><Chat /></RutaProtegida>} />
        <Route path="/admin" element={<RutaProtegida><Admin /></RutaProtegida>} />
        <Route path="/admin/eventos" element={<RutaProtegida><AdminEventos /></RutaProtegida>} />
        <Route path="/admin/reportes" element={<RutaProtegida><AdminReportes /></RutaProtegida>} />
        <Route path="/admin/auditoria" element={<RutaProtegida><AdminAuditoria /></RutaProtegida>} />
        <Route path="/admin/piezas" element={<RutaProtegida><AdminPiezas /></RutaProtegida>} />
        <Route path="/admin/feedback" element={<RutaProtegida><AdminFeedback /></RutaProtegida>} />
        <Route path="/admin/ranking" element={<RutaProtegida><AdminRanking /></RutaProtegida>} />
        <Route path="/panel" element={<RutaProtegida><Panel /></RutaProtegida>} />
        <Route path="/panel/piezas" element={<RutaProtegida><MisPiezas /></RutaProtegida>} />
        <Route path="/panel/pedidos" element={<RutaProtegida><MisPedidos /></RutaProtegida>} />
        <Route path="/panel/mensajes" element={<RutaProtegida><MisMensajes /></RutaProtegida>} />
        <Route path="/panel/perfil" element={<RutaProtegida><MiPerfil /></RutaProtegida>} />
        <Route path="/verificar" element={<Verificar />} />
        <Route path="/panel/clientes" element={<RutaProtegida><MisClientes /></RutaProtegida>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Botón flotante de feedback en todas las páginas */}
      <BotonFeedback />
    </BrowserRouter>
  )
}

export default App