import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

/*
 * Página unificada para recuperar contraseña.
 *
 * Modo 1: sin token en URL → muestra form para pedir el email
 * Modo 2: con token en URL → muestra form para setear nueva contraseña
 *
 * El token llega del email que recibe el usuario al pedir recuperación.
 */
export default function RecuperarPassword() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', padding: '40px',
                width: '100%', maxWidth: '420px'
            }}>
                {token ? <FormResetear token={token} /> : <FormSolicitar />}

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--color-text-2)' }}>
                    <Link to="/login">← Volver al login</Link>
                </p>
            </div>
        </div>
    )
}

// Modo 1: ingresar email para recibir el link
function FormSolicitar() {
    const [email, setEmail] = useState('')
    const [estado, setEstado] = useState('') // '' | 'enviando' | 'ok'

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim()) return
        setEstado('enviando')
        try {
            await api.post('/auth/olvide-password', { email })
            setEstado('ok')
        } catch {
            // Por seguridad, mostramos OK aunque haya error en backend
            setEstado('ok')
        }
    }

    if (estado === 'ok') {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    Revisá tu email
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: '1.6' }}>
                    Si ese email está registrado, te mandamos un link para crear una nueva contraseña.
                    El link vence en 1 hora.
                </p>
            </div>
        )
    }

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>
                    Recuperar contraseña
                </h1>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
                    Ingresá tu email y te mandamos un link
                </p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                    type="email" required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    style={inputStyle}
                />
                <button type="submit" disabled={estado === 'enviando'} style={btnStyle}>
                    {estado === 'enviando' ? 'Enviando...' : 'Enviar link'}
                </button>
            </form>
        </>
    )
}

// Modo 2: setear nueva contraseña con el token
function FormResetear({ token }) {
    const [pass, setPass] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [ok, setOk] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (pass.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            return
        }
        if (pass !== confirm) {
            setError('Las contraseñas no coinciden')
            return
        }
        setEnviando(true)
        try {
            await api.post('/auth/reset-password', { token, password: pass })
            setOk(true)
            setTimeout(() => navigate('/login'), 2500)
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar la contraseña')
        } finally {
            setEnviando(false)
        }
    }

    if (ok) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    Contraseña actualizada
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-2)' }}>
                    Te llevamos al login...
                </p>
            </div>
        )
    }

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>
                    Nueva contraseña
                </h1>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
                    Mínimo 8 caracteres
                </p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="password" required
                    value={pass} onChange={e => setPass(e.target.value)}
                    placeholder="Nueva contraseña" minLength={8}
                    autoComplete="new-password"
                    style={inputStyle} />
                <input type="password" required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirmá la contraseña" minLength={8}
                    autoComplete="new-password"
                    style={inputStyle} />
                {error && (
                    <p style={{
                        color: 'var(--color-danger)', fontSize: '13px',
                        background: '#e05c5c18', padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid #e05c5c33'
                    }}>{error}</p>
                )}
                <button type="submit" disabled={enviando} style={btnStyle}>
                    {enviando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
            </form>
        </>
    )
}

const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
    color: 'var(--color-text)', fontSize: '14px', outline: 'none'
}

const btnStyle = {
    background: 'var(--color-accent)', color: '#0f0f0f',
    border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '11px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer'
}
