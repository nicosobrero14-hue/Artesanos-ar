import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Campanita from './Campanita'

export default function Navbar() {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()
    const [adminPendientes, setAdminPendientes] = useState(0)

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

    return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '16px' }}>
            Artesanos
            </Link>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Inicio</Link>
            <Link to="/panel" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Panel</Link>
            <Link to="/panel/piezas" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Mis piezas</Link>
            <Link to="/panel/pedidos" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Pedidos</Link>
            <Link to="/chat" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>💬 Chat</Link>
            <Link to="/panel/clientes" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Clientes</Link>
            <Link to="/panel/eventos" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Eventos</Link>
            <Link to="/panel/cupones" style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Cupones</Link>
            {usuario?.rol === 'ADMIN' && (
                <Link to="/admin" style={{
                    position: 'relative',
                    color: '#f5b94f', fontSize: '14px', fontWeight: '600',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                ⚙ Admin
                {adminPendientes > 0 && (
                    <span style={{
                        background: 'var(--color-danger)', color: 'white',
                        fontSize: '10px', fontWeight: '700',
                        borderRadius: '20px',
                        minWidth: '18px', height: '18px',
                        padding: '0 6px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>{adminPendientes}</span>
                )}
                </Link>
            )}
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Campanita />
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
            style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                color: 'var(--color-text-2)',
                fontSize: '13px'
            }}
            >
            Salir
            </button>
        </div>
        </nav>
    )
}
