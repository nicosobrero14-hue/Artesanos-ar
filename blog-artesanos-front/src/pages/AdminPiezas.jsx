import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { optimizarThumb } from '../utils/cloudinary'

/*
 * Panel admin de moderación de piezas. Lista TODAS las piezas del sistema
 * (excluyendo las del admin), incluye estado de moderación.
 *
 * Acciones:
 *  - Ocultar / Mostrar (toggle con motivo)
 *  - Eliminar (con motivo, cascade dependencias)
 *  - Ver pieza en el catálogo público
 *
 * Filtros: visibles / ocultas / todas + búsqueda libre por título o artesano.
 */
export default function AdminPiezas() {
    const { usuario } = useAuth()
    const [piezas, setPiezas] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todas')
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') cargar()
    }, [usuario])

    const cargar = () => {
        setLoading(true)
        api.get('/admin/piezas')
            .then(res => setPiezas(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    const toggleOculta = async (p) => {
        const accion = p.oculta ? 'mostrar' : 'ocultar'
        const motivo = p.oculta ? '' : prompt(`Motivo para ocultar "${p.titulo}" (será visible para el dueño):`)
        if (!p.oculta && motivo === null) return // canceló
        try {
            await api.post(`/admin/piezas/${p.id}/toggle-oculta`, { motivo: motivo || '' })
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || `Error al ${accion}`)
        }
    }

    const eliminar = async (p) => {
        const motivo = prompt(`Motivo para ELIMINAR "${p.titulo}" (acción irreversible):`)
        if (motivo === null) return
        try {
            await api.delete(`/admin/piezas/${p.id}?motivo=${encodeURIComponent(motivo)}`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar')
        }
    }

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    const piezasFiltradas = piezas
        .filter(p => {
            if (filtro === 'ocultas') return p.oculta
            if (filtro === 'visibles') return !p.oculta
            return true
        })
        .filter(p => {
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            return p.titulo?.toLowerCase().includes(q)
                || p.artesanoNombre?.toLowerCase().includes(q)
        })

    const cantidadOcultas = piezas.filter(p => p.oculta).length

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>🛡 Moderación de piezas</h1>
                    <span style={{
                        background: 'var(--color-premium)', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Ocultar quita la pieza del público pero la conserva. Eliminar es irreversible.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por título o artesano..."
                        style={{
                            flex: '1 1 240px',
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                            color: 'var(--color-text)', fontSize: '14px', outline: 'none'
                        }} />
                    <Tab activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas ({piezas.length})</Tab>
                    <Tab activo={filtro === 'visibles'} onClick={() => setFiltro('visibles')}>Visibles</Tab>
                    <Tab activo={filtro === 'ocultas'} onClick={() => setFiltro('ocultas')}>
                        Ocultas {cantidadOcultas > 0 && `(${cantidadOcultas})`}
                    </Tab>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : piezasFiltradas.length === 0 ? (
                    <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-2)' }}>Sin resultados</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {piezasFiltradas.map(p => (
                            <div key={p.id} style={{
                                background: 'var(--color-bg-2)',
                                border: `1px solid ${p.oculta ? '#e05c5c55' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius)',
                                padding: '12px 16px',
                                display: 'flex', gap: '14px', alignItems: 'center',
                                opacity: p.oculta ? 0.7 : 1
                            }}>
                                {p.fotoPrincipal ? (
                                    <img src={optimizarThumb(p.fotoPrincipal)} alt=""
                                        style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: '60px', height: '60px', background: 'var(--color-bg-3)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{p.titulo}</span>
                                        {p.oculta && (
                                            <span style={{ fontSize: '10px', fontWeight: '700', background: '#e05c5c22', color: 'var(--color-danger)', padding: '2px 6px', borderRadius: '20px' }}>
                                                🚫 OCULTA
                                            </span>
                                        )}
                                        {p.destacada && (
                                            <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--color-premium)', color: '#0f0f0f', padding: '2px 6px', borderRadius: '20px' }}>
                                                ★
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                                        por <Link to={`/artesano/${p.artesanoSlug}`} style={{ color: 'var(--color-text-2)' }}>{p.artesanoNombre}</Link>
                                        {' · '}${Number(p.precio).toLocaleString('es-AR')}
                                        {' · '}{p.estado}
                                    </p>
                                    {p.oculta && p.motivoOculta && (
                                        <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', fontStyle: 'italic' }}>
                                            Motivo: {p.motivoOculta}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <Link to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`} target="_blank"
                                        style={btnStyle('var(--color-text-2)')}>
                                        Ver
                                    </Link>
                                    <button onClick={() => toggleOculta(p)} style={btnStyle(p.oculta ? 'var(--color-success)' : 'var(--color-premium)')}>
                                        {p.oculta ? '✓ Mostrar' : '🚫 Ocultar'}
                                    </button>
                                    <button onClick={() => eliminar(p)} style={btnStyle('var(--color-danger)')}>
                                        🗑 Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Tab({ activo, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            background: activo ? 'var(--color-accent)' : 'transparent',
            color: activo ? '#0f0f0f' : 'var(--color-text-2)',
            border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: '20px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer'
        }}>{children}</button>
    )
}
const btnStyle = (color) => ({
    background: 'transparent', border: `1px solid ${color}`,
    borderRadius: 'var(--radius-sm)', padding: '5px 10px',
    color, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
    textDecoration: 'none'
})
