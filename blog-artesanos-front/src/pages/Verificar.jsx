import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function Verificar() {
    const [searchParams] = useSearchParams()
    const [estado, setEstado] = useState('cargando') // cargando | ok | error
    const [mensaje, setMensaje] = useState('')
    const [emailReenvio, setEmailReenvio] = useState('')
    const [reenvioEstado, setReenvioEstado] = useState('') // '' | 'enviando' | 'ok' | 'error'

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            setEstado('error')
            setMensaje('Token inválido o faltante.')
            return
        }
        api.get(`/auth/verificar?token=${token}`)
            .then(() => setEstado('ok'))
            .catch(err => {
                setEstado('error')
                setMensaje(err.response?.data?.mensaje || 'El link venció o ya fue usado.')
            })
    }, [])

    const handleReenvio = async (e) => {
        e.preventDefault()
        if (!emailReenvio.trim()) return
        setReenvioEstado('enviando')
        try {
            await api.post('/auth/reenviar-verificacion', { email: emailReenvio })
            setReenvioEstado('ok')
        } catch {
            setReenvioEstado('error')
        }
    }

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', padding: '40px', maxWidth: '420px',
                width: '100%', textAlign: 'center'
            }}>
                {estado === 'cargando' && (
                    <p style={{ color: 'var(--color-text-2)' }}>Verificando tu cuenta...</p>
                )}

                {estado === 'ok' && (
                    <>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                            ¡Cuenta activada!
                        </h2>
                        <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
                            Tu cuenta está activa. Ya podés ingresar y mostrar tu trabajo.
                        </p>
                        <Link to="/login" style={{
                            display: 'inline-block',
                            background: 'var(--color-accent)', color: '#0f0f0f',
                            padding: '10px 24px', borderRadius: 'var(--radius-sm)',
                            fontWeight: '500', fontSize: '14px'
                        }}>
                            Ingresar
                        </Link>
                    </>
                )}

                {estado === 'error' && (
                    <>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✕</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                            Link inválido
                        </h2>
                        <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '28px' }}>
                            {mensaje}
                        </p>

                        {reenvioEstado === 'ok' ? (
                            <div style={{
                                background: '#4caf8218', border: '1px solid var(--color-success)',
                                borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '14px',
                                color: 'var(--color-success)'
                            }}>
                                Email reenviado. Revisá tu casilla.
                            </div>
                        ) : (
                            <>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '14px' }}>
                                    Ingresá tu email para recibir un nuevo link de verificación:
                                </p>
                                <form onSubmit={handleReenvio} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                                    <input
                                        type="email" required
                                        value={emailReenvio}
                                        onChange={e => setEmailReenvio(e.target.value)}
                                        placeholder="tu@email.com"
                                        style={{
                                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                                            color: 'var(--color-text)', fontSize: '14px', outline: 'none', width: '100%'
                                        }}
                                    />
                                    {reenvioEstado === 'error' && (
                                        <p style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
                                            No encontramos esa cuenta. Verificá el email.
                                        </p>
                                    )}
                                    <button type="submit" disabled={reenvioEstado === 'enviando'} style={{
                                        background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
                                        borderRadius: 'var(--radius-sm)', padding: '10px',
                                        fontWeight: '500', fontSize: '14px', cursor: 'pointer',
                                        opacity: reenvioEstado === 'enviando' ? 0.7 : 1
                                    }}>
                                        {reenvioEstado === 'enviando' ? 'Enviando...' : 'Reenviar email'}
                                    </button>
                                </form>
                                <Link to="/login" style={{ display: 'block', marginTop: '20px', color: 'var(--color-text-3)', fontSize: '13px' }}>
                                    Volver al login
                                </Link>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}