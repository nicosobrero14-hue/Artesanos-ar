import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

/*
 * Panel admin: tabla con todos los artesanos del sistema y acciones
 * para upgrade/downgrade del plan y activar/desactivar cuentas.
 *
 * Solo accesible si usuario.rol === 'ADMIN'. Si un USER intenta entrar,
 * el componente lo redirige a /panel (no rompe, simplemente no entra).
 */
export default function Admin() {
    const { usuario } = useAuth()
    const [artesanos, setArtesanos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('')
    const [filtroPlan, setFiltroPlan] = useState('TODOS')
    const [accionando, setAccionando] = useState(null) // id del artesano sobre el que se está actuando

    // Modal upgrade
    const [modalUpgrade, setModalUpgrade] = useState(null) // { id, nombre } o null
    const [meses, setMeses] = useState(1)

    const [pendientes, setPendientes] = useState({ eventos: 0, reportes: 0 })

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') {
            cargar()
            api.get('/admin/resumen-pendientes')
                .then(res => setPendientes(res.data))
                .catch(() => {})
        }
    }, [usuario])

    const cargar = () => {
        setLoading(true)
        api.get('/admin/artesanos')
            .then(res => setArtesanos(res.data))
            .catch(err => {
                console.error(err)
                alert('Error al cargar artesanos')
            })
            .finally(() => setLoading(false))
    }

    const handleUpgrade = async () => {
        if (!modalUpgrade) return
        setAccionando(modalUpgrade.id)
        try {
            await api.post(`/admin/artesanos/${modalUpgrade.id}/upgrade`, { meses })
            setModalUpgrade(null)
            setMeses(1)
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al activar Premium')
        } finally {
            setAccionando(null)
        }
    }

    const handleDowngrade = async (a) => {
        if (!confirm(`¿Bajar a GRATIS a ${a.nombre}?`)) return
        setAccionando(a.id)
        try {
            await api.post(`/admin/artesanos/${a.id}/downgrade`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al bajar a Gratis')
        } finally {
            setAccionando(null)
        }
    }

    const handleToggleActivo = async (a) => {
        let motivo = null
        if (a.activo) {
            // Suspendiendo — pedimos motivo que se le muestra al usuario al loguear
            motivo = prompt(
                `Suspender cuenta de ${a.nombre}.\n\nEl usuario verá este motivo al intentar loguearse:`,
                'Violación de los términos de uso'
            )
            if (motivo === null) return // canceló
        } else {
            // Reactivando — confirmación simple
            if (!confirm(`¿Reactivar la cuenta de ${a.nombre}?`)) return
        }
        setAccionando(a.id)
        try {
            await api.post(`/admin/artesanos/${a.id}/toggle-activo`, { motivo: motivo || '' })
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cambiar estado')
        } finally {
            setAccionando(null)
        }
    }

    // Si entró un USER, lo mandamos al panel normal
    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    const artesanosFiltrados = artesanos
        .filter(a => filtroPlan === 'TODOS' || a.plan === filtroPlan)
        .filter(a => {
            if (!filtro.trim()) return true
            const q = filtro.toLowerCase()
            return a.nombre?.toLowerCase().includes(q)
                || a.email?.toLowerCase().includes(q)
                || a.slug?.toLowerCase().includes(q)
        })

    const stats = {
        total: artesanos.length,
        premium: artesanos.filter(a => a.esPremium).length,
        gratis: artesanos.filter(a => !a.esPremium).length,
        inactivos: artesanos.filter(a => !a.activo).length
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />

            <div className="container-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Panel Admin</h1>
                    <span style={{
                        background: '#f5b94f', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '16px' }}>
                    Gestión global de artesanos. Cuando alguien te transfiere el pago, lo upgradeas desde acá.
                </p>

                <div className="tabs-scroll-mobile" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <TabAdmin to="/admin" activo label="Artesanos" />
                    <TabAdmin to="/admin/piezas" icono="🛡" label="Piezas" />
                    <TabAdmin to="/admin/eventos" icono="📅" label="Eventos" badge={pendientes.eventos} />
                    <TabAdmin to="/admin/reportes" icono="🚩" label="Reportes" badge={pendientes.reportes} />
                    <TabAdmin to="/admin/feedback" icono="💡" label="Feedback" />
                    <TabAdmin to="/admin/ranking" icono="🏆" label="Ranking" />
                    <TabAdmin to="/admin/anuncios" icono="📢" label="Anuncios" />
                    <TabAdmin to="/admin/cargar-pieza" icono="📦" label="Cargar pieza" />
                    <TabAdmin to="/admin/auditoria" icono="📜" label="Auditoria" />

                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px', marginBottom: '24px'
                }}>
                    <StatCard label="Total" value={stats.total} />
                    <StatCard label="Premium activos" value={stats.premium} color="#f5b94f" />
                    <StatCard label="Plan gratis" value={stats.gratis} />
                    <StatCard label="Inactivos" value={stats.inactivos} color="var(--color-danger)" />
                </div>

                {/* Filtros */}
                <div className="stack-mobile" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                        placeholder="Buscar por nombre, email o slug..."
                        style={{
                            flex: '1 1 300px',
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                            color: 'var(--color-text)', fontSize: '14px', outline: 'none'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {['TODOS', 'PREMIUM', 'GRATIS'].map(p => (
                            <button key={p} onClick={() => setFiltroPlan(p)} style={{
                                background: filtroPlan === p ? 'var(--color-accent)' : 'transparent',
                                color: filtroPlan === p ? '#0f0f0f' : 'var(--color-text-2)',
                                border: `1px solid ${filtroPlan === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderRadius: '20px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
                            }}>
                                {p === 'TODOS' ? 'Todos' : p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla */}
                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-3)', textAlign: 'left' }}>
                                        <Th>Artesano</Th>
                                        <Th>Email</Th>
                                        <Th>Plan</Th>
                                        <Th>Vence</Th>
                                        <Th>Piezas</Th>
                                        <Th>Estado</Th>
                                        <Th>Rol</Th>
                                        <Th align="right">Acciones</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {artesanosFiltrados.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-3)' }}>
                                            Sin resultados
                                        </td></tr>
                                    ) : artesanosFiltrados.map(a => (
                                        <tr key={a.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                            <Td>
                                                <a href={`/artesano/${a.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text)', fontWeight: '500' }}>
                                                    {a.nombre}
                                                </a>
                                            </Td>
                                            <Td><span style={{ color: 'var(--color-text-2)' }}>{a.email}</span></Td>
                                            <Td>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: '600',
                                                    background: a.esPremium ? '#f5b94f' : 'var(--color-bg-3)',
                                                    color: a.esPremium ? '#0f0f0f' : 'var(--color-text-2)',
                                                    padding: '2px 8px', borderRadius: '20px'
                                                }}>
                                                    {a.esPremium ? '★ PREMIUM' : 'GRATIS'}
                                                </span>
                                            </Td>
                                            <Td>
                                                <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
                                                    {a.fechaExpiracionPlan
                                                        ? new Date(a.fechaExpiracionPlan).toLocaleDateString('es-AR')
                                                        : a.esPremium ? '∞' : '—'}
                                                </span>
                                            </Td>
                                            <Td><span>{a.totalPiezas}</span></Td>
                                            <Td>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: a.activo ? 'var(--color-success)' : 'var(--color-danger)'
                                                }}>
                                                    {a.activo ? '● Activo' : '○ Inactivo'}
                                                </span>
                                            </Td>
                                            <Td>
                                                {a.rol === 'ADMIN' ? (
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: '700',
                                                        background: '#f5b94f', color: '#0f0f0f',
                                                        padding: '2px 6px', borderRadius: '20px'
                                                    }}>ADMIN</span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>user</span>
                                                )}
                                            </Td>
                                            <Td align="right">
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    {a.rol !== 'ADMIN' && (
                                                        <>
                                                            {a.esPremium ? (
                                                                <BotonAccion onClick={() => handleDowngrade(a)} disabled={accionando === a.id}>
                                                                    Downgrade
                                                                </BotonAccion>
                                                            ) : (
                                                                <BotonAccion onClick={() => setModalUpgrade(a)} disabled={accionando === a.id} highlight>
                                                                    ★ Upgrade
                                                                </BotonAccion>
                                                            )}
                                                            <BotonAccion onClick={() => handleToggleActivo(a)} disabled={accionando === a.id} danger={a.activo}>
                                                                {a.activo ? 'Bloquear' : 'Habilitar'}
                                                            </BotonAccion>
                                                        </>
                                                    )}
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Upgrade */}
            {modalUpgrade && (
                <div onClick={() => setModalUpgrade(null)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '28px', maxWidth: '420px', width: '90%'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            Upgrade a Premium
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
                            Activar Premium para <strong>{modalUpgrade.nombre}</strong>
                        </p>

                        <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '8px' }}>
                            Cantidad de meses
                        </label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                            {[1, 3, 6, 12].map(m => (
                                <button key={m} onClick={() => setMeses(m)} style={{
                                    flex: 1,
                                    background: meses === m ? 'var(--color-accent)' : 'transparent',
                                    color: meses === m ? '#0f0f0f' : 'var(--color-text-2)',
                                    border: `1px solid ${meses === m ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-sm)', padding: '8px', fontSize: '13px',
                                    fontWeight: meses === m ? '600' : '400', cursor: 'pointer'
                                }}>
                                    {m} {m === 1 ? 'mes' : 'meses'}
                                </button>
                            ))}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '20px' }}>
                            Si ya es premium y todavía no expiró, se suman los meses sin perder los días que le quedan.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModalUpgrade(null)} style={{
                                background: 'transparent', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                                color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer'
                            }}>Cancelar</button>
                            <button onClick={handleUpgrade} disabled={accionando === modalUpgrade.id} style={{
                                background: '#f5b94f', color: '#0f0f0f', border: 'none',
                                borderRadius: 'var(--radius-sm)', padding: '8px 20px',
                                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                            }}>
                                {accionando === modalUpgrade.id ? 'Activando...' : `Activar ${meses} ${meses === 1 ? 'mes' : 'meses'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/*
 * Tab del panel admin con badge rojo opcional para mostrar pendientes.
 * `activo=true` lo pinta dorado. Si recibe `badge` > 0, muestra el número en rojo.
 */
function TabAdmin({ to, label, icono, badge, activo }) {
    return (
        <Link to={to} style={{
            position: 'relative',
            background: activo ? 'var(--color-accent)' : 'transparent',
            color: activo ? '#0f0f0f' : 'var(--color-text-2)',
            border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-border)'}`,
            padding: '7px 16px', borderRadius: '20px',
            fontSize: '13px', fontWeight: activo ? '500' : '400',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
            {icono && <span>{icono}</span>}
            <span>{label}</span>
            {badge > 0 && (
                <span style={{
                    background: 'var(--color-danger)', color: 'white',
                    fontSize: '10px', fontWeight: '700',
                    borderRadius: '20px',
                    minWidth: '18px', height: '18px',
                    padding: '0 6px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}>{badge}</span>
            )}
        </Link>
    )
}

function StatCard({ label, value, color }) {
    return (
        <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '16px'
        }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: color || 'var(--color-text)' }}>{value}</p>
        </div>
    )
}

function Th({ children, align }) {
    return (
        <th style={{
            padding: '12px 14px', fontSize: '11px', fontWeight: '500',
            color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em',
            textAlign: align || 'left'
        }}>{children}</th>
    )
}

function Td({ children, align }) {
    return <td style={{ padding: '12px 14px', textAlign: align || 'left' }}>{children}</td>
}

function BotonAccion({ children, onClick, disabled, highlight, danger }) {
    let color = 'var(--color-text-2)'
    let border = 'var(--color-border)'
    if (highlight) { color = '#f5b94f'; border = '#f5b94f' }
    if (danger) { color = 'var(--color-danger)'; border = 'var(--color-border)' }
    return (
        <button onClick={onClick} disabled={disabled} style={{
            background: 'transparent', border: `1px solid ${border}`,
            borderRadius: 'var(--radius-sm)', padding: '5px 10px',
            color, fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: highlight ? '600' : '400',
            opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap'
        }}>{children}</button>
    )
}
