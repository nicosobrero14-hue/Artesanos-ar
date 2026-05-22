import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

/*
 * Este componente carga las estadísticas del artesano logueado.
 * useEffect con array vacío [] se ejecuta UNA SOLA VEZ cuando el componente
 * aparece en pantalla — equivale al "al cargar la página" de JavaScript puro.
 */
export default function Panel() {
    const [stats, setStats] = useState(null)
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/artesanos/mi-panel/estadisticas'),
            api.get('/artesanos/mi-panel/plan')
        ])
        .then(([resStats, resPlan]) => {
            setStats(resStats.data)
            setPlan(resPlan.data)
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />

        <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>
            Panel
            </h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
            Resumen de tu taller
            </p>

            {/* Tarjeta del plan actual */}
            {plan && (
            <div style={{
                background: plan.esPremium
                    ? 'linear-gradient(135deg, #f5b94f22, #f59f3322)'
                    : 'var(--color-bg-2)',
                border: `1px solid ${plan.esPremium ? '#f5b94f' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
            }} className="stack-mobile">
                <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Plan actual
                    </span>
                    <span style={{
                    fontSize: '12px', fontWeight: '600',
                    background: plan.esPremium ? '#f5b94f' : 'var(--color-bg-3)',
                    color: plan.esPremium ? '#0f0f0f' : 'var(--color-text-2)',
                    padding: '2px 10px', borderRadius: '20px'
                    }}>
                    {plan.esPremium ? '★ PREMIUM' : 'GRATIS'}
                    </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                    {plan.maxPiezas
                    ? `${plan.piezasActuales} / ${plan.maxPiezas} piezas · hasta ${plan.maxFotosPorPieza} fotos por pieza`
                    : `${plan.piezasActuales} piezas · hasta ${plan.maxFotosPorPieza} fotos por pieza · piezas ilimitadas`}
                </p>
                {plan.esPremium && plan.fechaExpiracionPlan && (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                    Vence el {new Date(plan.fechaExpiracionPlan).toLocaleDateString('es-AR')}
                    </p>
                )}
                </div>
                {!plan.esPremium && (
                <Link to="/premium" style={{
                    background: '#f5b94f', color: '#0f0f0f',
                    padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'
                }}>
                    Pasarme a Premium →
                </Link>
                )}
            </div>
            )}

            {loading ? (
            <p style={{ color: 'var(--color-text-2)' }}>Cargando estadísticas...</p>
            ) : stats ? (
            <>
                {/* Tarjetas de estadísticas */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
                }}>
                <StatCard label="Piezas activas" value={stats.totalPiezas} sub={`${stats.piezasDisponibles} disponibles`} />
                <StatCard label="Pedidos abiertos" value={stats.pedidosAbiertos} sub={`${stats.pedidosListos} listos para entregar`} color="var(--color-accent)" />
                <StatCard label="Piezas vendidas" value={stats.piezasVendidas} sub="historial total" />
                <StatCard label="Horas trabajadas" value={stats.totalHorasTrabajadas} sub="en todas las piezas" />
                <StatCard
                    label="Valor hora promedio"
                    value={stats.valorHoraPromedio ? `$${Number(stats.valorHoraPromedio).toLocaleString('es-AR')}` : '-'}
                    sub="basado en piezas vendidas"
                    color="var(--color-success)"
                />
                <StatCard label="Mensajes sin leer" value={stats.mensajesNoLeidos} sub="" color={stats.mensajesNoLeidos > 0 ? 'var(--color-accent)' : undefined} />
                <StatCard label="Visitas a tu perfil" value={stats.visitasPerfil ?? 0} sub="desde que te registraste" color="var(--color-accent)" />
                </div>

                {/* Accesos rápidos */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
                }}>
                <AccionCard to="/panel/piezas" titulo="Gestionar piezas" desc="Agregar, editar o cambiar estado de tus piezas" />
                <AccionCard to="/panel/pedidos" titulo="Ver pedidos" desc="Seguí el estado de cada encargo" />
                <AccionCard to="/panel/mensajes" titulo="Mensajes recibidos" desc="Consultas desde tu catálogo público" />
                <AccionCard to="/panel/eventos" titulo="📅 Mis eventos" desc="Ferias y exposiciones donde vas a estar" />
                <AccionCard to="/panel/cupones" titulo="🎟 Cupones" desc="Descuentos para atraer clientes (Premium)" />
                <AccionCard to="/panel/stats" titulo="📊 Stats avanzadas" desc="Métricas de engagement (Premium)" />
                <AccionCard to="/favoritos" titulo="🔖 Mis favoritos" desc="Piezas que guardaste para volver" />
                <AccionCard to="/panel/perfil" titulo="Editar perfil" desc="Bio, redes, ubicación y foto de perfil" />
                </div>
            </>
            ) : (
            <p style={{ color: 'var(--color-danger)' }}>No se pudieron cargar las estadísticas</p>
            )}
        </div>
        </div>
    )
    }

    // Componente interno — tarjeta de estadística
    function StatCard({ label, value, sub, color }) {
    return (
        <div style={{
        background: 'var(--color-bg-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px'
        }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '8px' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: '600', color: color || 'var(--color-text)', marginBottom: '4px' }}>
            {value ?? '-'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{sub}</p>
        </div>
    )
    }

    // Componente interno — tarjeta de acceso rápido
    function AccionCard({ to, titulo, desc }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
        <div style={{
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            transition: 'border-color 0.15s',
            cursor: 'pointer'
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
            <p style={{ fontWeight: '500', marginBottom: '6px', color: 'var(--color-text)' }}>{titulo}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{desc}</p>
        </div>
        </Link>
    )
    }