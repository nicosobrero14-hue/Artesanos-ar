import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [mostrarReenvio, setMostrarReenvio] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        // Validación básica — no enviar si algún campo está vacío
        if (!form.email.trim() || !form.password.trim()) {
        setError('Completá email y contraseña')
        return
        }
        setError('')
        setMostrarReenvio(false)
        setLoading(true)
        try {
        const { data } = await api.post('/auth/login', form)
        login(data)
        // Si vine de otra página con ?next=, vuelvo ahí después de loguearme
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        navigate(next || '/panel')
        } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error
        if (msg?.includes('no verificada') || msg?.includes('verificad')) {
            setError('Tu cuenta no está verificada. Revisá tu email.')
            setMostrarReenvio(true)
        } else if (msg?.toLowerCase().includes('suspendida')) {
            // Mostramos el motivo de suspensión completo que viene del backend
            setError(msg)
        } else if (err.response?.status === 401) {
            // 401 = credenciales mal (BadCredentialsException)
            setError('Email o contraseña incorrectos')
        } else if (msg) {
            // Cualquier otro mensaje del backend lo mostramos tal cual
            setError(msg)
        } else {
            setError('Error al ingresar')
        }
        } finally {
        setLoading(false)
        }
    }

    return (
        <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
        <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '40px', width: '100%', maxWidth: '400px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>Bienvenido</h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Ingresa a tu panel de artesano</p>
            </div>

            {/* autoComplete="off" evita que el browser llene y envíe el form solo */}
            <form onSubmit={handleSubmit} autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Input label="Email" type="email" name="email"
                placeholder="tu@email.com" autoComplete="off"
                value={form.email} onChange={handleChange} required />

            <Input label="Contrasena" type="password" name="password"
                placeholder="••••••••" autoComplete="new-password"
                value={form.password} onChange={handleChange} required />

            {error && (
                <p style={{
                color: 'var(--color-danger)', fontSize: '13px',
                background: '#e05c5c18', padding: '10px 12px',
                borderRadius: 'var(--radius-sm)', border: '1px solid #e05c5c33'
                }}>
                {error}
                </p>
            )}

            {mostrarReenvio && (
                <button type="button"
                onClick={async () => {
                    try {
                    await api.post('/auth/reenviar-verificacion', { email: form.email })
                    alert('Email de verificacion reenviado')
                    } catch {
                    alert('Error al reenviar')
                    }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '13px', padding: 0, textAlign: 'left' }}
                >
                Reenviar email de verificacion
                </button>
            )}

            <Button type="submit" loading={loading} fullWidth>Ingresar</Button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
            <Link to="/recuperar-password" style={{ color: 'var(--color-text-2)' }}>
                ¿Olvidaste tu contraseña?
            </Link>
            </p>
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--color-text-2)' }}>
            No tenes cuenta?{' '}<Link to="/registro">Registrate aca</Link>
            </p>
        </div>
        </div>
    )
    }