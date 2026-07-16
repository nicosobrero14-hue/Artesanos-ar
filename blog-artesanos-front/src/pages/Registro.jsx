import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Input from '../components/Input'
import Button from '../components/Button'
import { useToast } from '../context/ToastContext'

export default function Registro() {
    const toast = useToast()
    const [form, setForm] = useState({ nombre: '', email: '', password: '', ubicacion: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [registrado, setRegistrado] = useState(false)

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
        }
        setLoading(true)
        try {
        await api.post('/auth/register', form)
        setRegistrado(true)
        } catch (err) {
        setError(err.response?.data?.message || 'Ya existe una cuenta con ese email')
        } finally {
        setLoading(false)
        }
    }

    // Pantalla post-registro — separada del formulario, sin mezclar
    if (registrado) return (
        <div style={{
        minHeight: '100vh', background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
        <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '40px', maxWidth: '420px',
            width: '100%', textAlign: 'center'
        }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Revisá tu email</h2>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '8px' }}>
            Te mandamos un link de activación a <strong>{form.email}</strong>
            </p>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', marginBottom: '24px' }}>
            Hacé click en el link para activar tu cuenta. Vence en 24 horas.
            </p>
            <button
            onClick={async () => {
                try {
                await api.post('/auth/reenviar-verificacion', { email: form.email })
                toast('Email reenviado', 'success')
                } catch {
                toast('Error al reenviar', 'error')
                }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '13px' }}
            >
            No llegó el email — reenviar
            </button>
        </div>
        </div>
    )

    // Formulario de registro
    return (
        <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
        <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '40px', width: '100%', maxWidth: '420px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>Crear cuenta</h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
                Registrá tu taller y empezá a mostrar tu trabajo
            </p>
            </div>

            {/* Banner de trial Premium gratis al verificar la cuenta. */}
            <div style={{
                background: 'rgba(245, 185, 79, 0.10)',
                border: '1px solid #f5b94f55',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '24px',
                fontSize: '13px',
                color: 'var(--color-text)',
                lineHeight: '1.5'
            }}>
                <p style={{ marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--color-premium)' }}>🎁 1 mes de Premium gratis</strong>
                </p>
                <p style={{ color: 'var(--color-text-2)', fontSize: '12px' }}>
                    Al verificar tu cuenta. Destacá piezas, subí más fotos y videos.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Nombre o nombre del taller" type="text" name="nombre"
                placeholder="Ej: Nico Sobrero — cuchillos artesanales"
                value={form.nombre} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" placeholder="tu@email.com"
                value={form.email} onChange={handleChange} required />
            <Input label="Contraseña" type="password" name="password" placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={handleChange} required />
            <Input label="Ubicación (opcional)" type="text" name="ubicacion"
                placeholder="Ej: Rafaela, Santa Fe"
                value={form.ubicacion} onChange={handleChange} />

            {error && (
                <p style={{
                color: 'var(--color-danger)', fontSize: '13px',
                background: '#e05c5c18', padding: '10px 12px',
                borderRadius: 'var(--radius-sm)', border: '1px solid #e05c5c33'
                }}>
                {error}
                </p>
            )}

            <Button type="submit" loading={loading} fullWidth>Crear cuenta</Button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--color-text-2)' }}>
            ¿Ya tenés cuenta?{' '}<Link to="/login">Ingresá acá</Link>
            </p>
        </div>
        </div>
    )
}