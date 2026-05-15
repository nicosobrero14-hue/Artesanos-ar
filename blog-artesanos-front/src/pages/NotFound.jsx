import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div style={{
        minHeight: '100vh', background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
        <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '64px', marginBottom: '16px' }}>404</p>
            <h1 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px' }}>
            Pagina no encontrada
            </h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
            La pagina que buscas no existe o fue movida.
            </p>
            <Link to="/" style={{
            background: 'var(--color-accent)', color: '#0f0f0f',
            padding: '10px 24px', borderRadius: 'var(--radius-sm)',
            fontWeight: '500', fontSize: '14px'
            }}>
            Volver al inicio
            </Link>
        </div>
        </div>
    )
}