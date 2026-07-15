import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'

/*
 * Admin → Anuncios.
 * Permite mandar una notificación in-app a TODOS los artesanos activos no-admin.
 * Aparece en la campana de notificaciones de cada usuario.
 *
 * Opcionalmente lleva una URL de destino al hacer click en la notificación.
 */
export default function AdminAnuncios() {
    const { usuario } = useAuth()
    const confirm = useConfirm()
    const toast = useToast()
    const [mensaje, setMensaje] = useState('')
    const [url, setUrl] = useState('')
    const [enviarEmail, setEnviarEmail] = useState(true)
    const [enviando, setEnviando] = useState(false)
    const [resultado, setResultado] = useState(null) // { enviadas, conEmail } | null

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    const enviar = async (e) => {
        e.preventDefault()
        if (!mensaje.trim()) return
        const ok = await confirm({
            titulo: 'Enviar anuncio global',
            mensaje: `¿Mandar este anuncio a TODOS los usuarios activos?\n\n"${mensaje.trim()}"\n\n` +
                `Aparece en la campana de notificaciones` +
                (enviarEmail ? ' y además les llega por email.' : ' de cada usuario.'),
            confirmLabel: 'Enviar'
        })
        if (!ok) return

        setEnviando(true)
        setResultado(null)
        try {
            const body = { mensaje: mensaje.trim(), enviarEmail: String(enviarEmail) }
            if (url.trim()) body.url = url.trim()
            const { data } = await api.post('/admin/notificaciones/global', body)
            setResultado(data)
            setMensaje('')
            setUrl('')
        } catch (err) {
            toast(err.response?.data?.message || 'Error al enviar el anuncio', 'error')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>📢 Anuncios globales</h1>
                    <span style={{
                        background: 'var(--color-premium)', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Mandá una notificación a todos los artesanos activos. Aparece en la campanita de cada usuario.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <Link to="/admin" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>← Volver al admin</Link>
                </div>

                <form onSubmit={enviar} style={{
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)', padding: '20px'
                }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '6px' }}>
                        Mensaje (máx. 500 caracteres)
                    </label>
                    <textarea
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        rows={5}
                        maxLength={500}
                        placeholder="Ej: ¡Sumamos nueva sección de eventos! Entrá a tu panel para crear el tuyo."
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--color-bg-3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                            color: 'var(--color-text)', fontSize: '14px',
                            outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', lineHeight: '1.5'
                        }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right', marginTop: '4px' }}>
                        {mensaje.length}/500
                    </p>

                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-2)', margin: '16px 0 6px' }}>
                        URL de destino (opcional)
                    </label>
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="/eventos, /premium, etc. (a dónde lleva al hacer click)"
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--color-bg-3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                            color: 'var(--color-text)', fontSize: '14px', outline: 'none'
                        }}
                    />

                    {/* Checkbox: mandar también por email */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        margin: '16px 0 4px', fontSize: '13px',
                        color: 'var(--color-text-2)', cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={enviarEmail}
                            onChange={e => setEnviarEmail(e.target.checked)}
                        />
                        Enviar también por email (además de la notificación in-app)
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button
                            type="submit"
                            disabled={enviando || !mensaje.trim()}
                            style={{
                                background: 'var(--color-accent)', color: '#0f0f0f',
                                border: 'none', borderRadius: 'var(--radius-sm)',
                                padding: '10px 22px', fontSize: '14px', fontWeight: '600',
                                cursor: (enviando || !mensaje.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (enviando || !mensaje.trim()) ? 0.5 : 1
                            }}
                        >
                            {enviando ? 'Enviando...' : '📢 Enviar a todos'}
                        </button>
                    </div>

                    {resultado && (
                        <div style={{
                            marginTop: '16px', padding: '12px 14px',
                            background: '#1f3a23', border: '1px solid var(--color-success)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-success)', fontSize: '13px'
                        }}>
                            ✓ Anuncio enviado a <strong>{resultado.enviadas}</strong> usuario{resultado.enviadas !== 1 ? 's' : ''}
                            {resultado.conEmail ? ' (notificación + email)' : ' (solo notificación)'}.
                        </div>
                    )}
                </form>

                <p style={{ color: 'var(--color-text-3)', fontSize: '12px', marginTop: '20px', lineHeight: '1.6' }}>
                    💡 <strong>Tip:</strong> evitá mandar más de un anuncio por semana — la gente deja de mirar la campana si se llena.
                    Usá esto para novedades importantes (features nuevas, eventos, mantenimientos programados).
                </p>
            </div>
        </div>
    )
}
