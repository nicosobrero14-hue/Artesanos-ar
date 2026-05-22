import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Campanita from './Campanita'
import MobileDrawer from './MobileDrawer'

/*
 * Navbar responsive.
 *
 *  - Desktop (> 768px): todos los links en línea horizontal.
 *  - Mobile (<= 768px): logo + campana + botón ☰ que abre un drawer lateral
 *    con todos los links agrupados por sección.
 *
 * Los items se definen una sola vez en `links` para evitar duplicación entre
 * la vista desktop y el drawer mobile.
 */
export default function Navbar() {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [adminPendientes, setAdminPendientes] = useState(0)
    const [drawerAbierto, setDrawerAbierto] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    /*
     * Si es admin, poll cada 60s para mostrar badge rojo sobre "⚙ Admin"
     * cuando hay eventos sin aprobar o reportes sin resolver.
     */
    useEffect(() => {
        if (usuario?.rol !== 'ADMIN') return
        const tick = () => {
            api.get('/admin/resumen-pendientes')
                .then(res => setAdminPendientes(res.data.total || 0))
                .catch(() => {})
        }
        tick()
        const id = setInterval(tick, 60000)
        return () => clearInterval(id)
    }, [usuario])

    // Cerrar drawer al cambiar de ruta
    useEffect(() => { setDrawerAbierto(false) }, [location.pathname])

    /*
     * Lista única de links — la usamos en desktop y en el drawer mobile.
     * `tipo` permite separar visualmente los grupos en el drawer.
     */
    const links = [
        { to: '/', label: 'Inicio' },
        { to: '/novedades', label: '✨ Novedades' },
        { to: '/panel', label: 'Panel' },
        { to: '/panel/piezas', label: 'Mis piezas' },
        { to: '/panel/pedidos', label: 'Pedidos' },
        { to: '/chat', label: '💬 Chat' },
        { to: '/panel/clientes', label: 'Clientes' },
        { to: '/panel/eventos', label: 'Eventos' },
        { to: '/panel/cupones', label: 'Cupones' }
    ]

    return (
        <>
            <nav style={{
                background: 'var(--color-bg-2)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 24px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                {/* Lado izquierdo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', minWidth: 0 }}>
                    <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '16px', flexShrink: 0 }}>
                        Artesanos
                    </Link>

                    {/* Links desktop */}
                    <div className="solo-desktop" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {links.map(l => (
                            <Link key={l.to} to={l.to} style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
                                {l.label}
                            </Link>
                        ))}
                        {usuario?.rol === 'ADMIN' && (
                            <Link to="/admin" style={{
                                position: 'relative',
                                color: '#f5b94f', fontSize: '14px', fontWeight: '600',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                                ⚙ Admin
                                {adminPendientes > 0 && (
                                    <span style={badgePendientes}>{adminPendientes}</span>
                                )}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Lado derecho */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Campanita />

                    {/* Datos del usuario — solo desktop */}
                    <div className="solo-desktop" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {usuario?.slug && (
                            <a
                                href={`/artesano/${usuario.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '13px', color: 'var(--color-text-2)' }}
                            >
                                Ver mi catálogo ↗
                            </a>
                        )}
                        <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                            {usuario?.nombre}
                        </span>
                        <button
                            onClick={handleLogout}
                            style={btnSalir}
                        >
                            Salir
                        </button>
                    </div>

                    {/* Botón hamburguesa — solo mobile */}
                    <button
                        className="solo-mobile-flex"
                        onClick={() => setDrawerAbierto(true)}
                        aria-label="Abrir menú"
                        style={{
                            display: 'none',
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            width: '38px', height: '38px',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text)',
                            position: 'relative'
                        }}
                    >
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>☰</span>
                        {usuario?.rol === 'ADMIN' && adminPendientes > 0 && (
                            <span style={{ ...badgePendientes, position: 'absolute', top: '-4px', right: '-4px' }}>
                                {adminPendientes}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Drawer mobile */}
            <MobileDrawer abierto={drawerAbierto} onClose={() => setDrawerAbierto(false)}>
                {/* Header del drawer */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{
                            fontSize: '15px', fontWeight: '600',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{usuario?.nombre || 'Menú'}</p>
                        {usuario?.email && (
                            <p style={{
                                fontSize: '11px', color: 'var(--color-text-3)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>{usuario.email}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setDrawerAbierto(false)}
                        aria-label="Cerrar"
                        style={{
                            background: 'transparent', border: 'none',
                            color: 'var(--color-text-2)', fontSize: '22px',
                            lineHeight: 1, padding: '4px 8px'
                        }}
                    >×</button>
                </div>

                {/* Links */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', flex: 1 }}>
                    {links.map(l => (
                        <Link key={l.to} to={l.to} style={drawerLink}>
                            {l.label}
                        </Link>
                    ))}
                    {usuario?.rol === 'ADMIN' && (
                        <Link to="/admin" style={{
                            ...drawerLink,
                            color: '#f5b94f', fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <span>⚙ Panel Admin</span>
                            {adminPendientes > 0 && (
                                <span style={badgePendientes}>{adminPendientes}</span>
                            )}
                        </Link>
                    )}
                </div>

                {/* Footer del drawer */}
                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '12px 20px',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                    {usuario?.slug && (
                        <a
                            href={`/artesano/${usuario.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '13px', color: 'var(--color-text-2)' }}
                        >
                            Ver mi catálogo ↗
                        </a>
                    )}
                    <button onClick={handleLogout} style={btnSalir}>
                        Cerrar sesión
                    </button>
                </div>
            </MobileDrawer>
        </>
    )
}

const drawerLink = {
    padding: '12px 20px',
    fontSize: '14px',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)'
}

const badgePendientes = {
    background: 'var(--color-danger)', color: 'white',
    fontSize: '10px', fontWeight: '700',
    borderRadius: '20px',
    minWidth: '18px', height: '18px',
    padding: '0 6px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
}

const btnSalir = {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    color: 'var(--color-text-2)',
    fontSize: '13px'
}
