import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/*
 * Botón flotante "Feedback" en la esquina inferior derecha de toda la app.
 * Al click abre un modal con form sencillo.
 *
 * Funciona logueado o anónimo. El backend guarda en DB + manda email al admin
 * para respaldo doble.
 */
const TIPOS = ['Bug / Error', 'Mejora', 'Pregunta', 'Otro']

export default function BotonFeedback() {
    const { usuario } = useAuth()
    const toast = useToast()
    const [abierto, setAbierto] = useState(false)
    const [tipo, setTipo] = useState('Mejora')
    const [mensaje, setMensaje] = useState('')
    const [autorNombre, setAutorNombre] = useState('')
    const [autorEmail, setAutorEmail] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)

    const handleEnviar = async (e) => {
        e.preventDefault()
        if (!mensaje.trim()) return
        setEnviando(true)
        try {
            const payload = { tipo, mensaje }
            if (!usuario) {
                payload.autorNombre = autorNombre || null
                payload.autorEmail = autorEmail || null
            }
            await api.post('/feedback', payload)
            setEnviado(true)
            setTimeout(() => {
                setAbierto(false)
                setEnviado(false)
                setMensaje('')
            }, 2000)
        } catch (err) {
            toast(err.response?.data?.message || 'Error al enviar el feedback', 'error')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <>
            <button onClick={() => setAbierto(true)} title="Mandanos tu feedback"
                style={{
                    position: 'fixed',
                    bottom: '20px', right: '20px',
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '40px',
                    padding: '10px 18px',
                    color: 'var(--color-text-2)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    zIndex: 50,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)'
                    e.currentTarget.style.color = 'var(--color-accent)'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.color = 'var(--color-text-2)'
                }}
            >
                💡 Feedback
            </button>

            {abierto && (
                <div onClick={() => setAbierto(false)} style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px'
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        padding: '28px',
                        maxWidth: '480px', width: '100%'
                    }}>
                        {enviado ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💌</div>
                                <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
                                    ¡Feedback enviado!
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                    Gracias. Lo vamos a revisar.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleEnviar}>
                                <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '4px' }}>
                                    💡 Tu opinión nos importa
                                </h2>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
                                    Reportá errores, sugerí mejoras o contanos qué te gustaría ver.
                                </p>

                                <label style={lblStyle}>Tipo</label>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                    {TIPOS.map(t => (
                                        <button type="button" key={t} onClick={() => setTipo(t)}
                                            style={{
                                                background: tipo === t ? 'var(--color-accent)' : 'transparent',
                                                color: tipo === t ? '#0f0f0f' : 'var(--color-text-2)',
                                                border: `1px solid ${tipo === t ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                                borderRadius: '20px', padding: '5px 12px',
                                                fontSize: '12px', cursor: 'pointer'
                                            }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <label style={lblStyle}>Mensaje *</label>
                                <textarea required value={mensaje}
                                    onChange={e => setMensaje(e.target.value)}
                                    rows={5} maxLength={2000}
                                    placeholder="Contanos qué pasó, qué te gustaría, qué no funciona..."
                                    style={{
                                        ...inputStyle, resize: 'vertical', marginBottom: '14px'
                                    }} />

                                {!usuario && (
                                    <>
                                        <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '8px' }}>
                                            Opcional — para responderte si hace falta:
                                        </p>
                                        <input value={autorNombre} onChange={e => setAutorNombre(e.target.value)}
                                            placeholder="Tu nombre" maxLength={100}
                                            style={{ ...inputStyle, marginBottom: '8px' }} />
                                        <input type="email" value={autorEmail} onChange={e => setAutorEmail(e.target.value)}
                                            placeholder="Tu email" maxLength={200}
                                            style={{ ...inputStyle, marginBottom: '14px' }} />
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setAbierto(false)}
                                        style={btnGhost}>Cancelar</button>
                                    <button type="submit" disabled={enviando || !mensaje.trim()}
                                        style={{
                                            ...btnPrimario,
                                            opacity: enviando || !mensaje.trim() ? 0.6 : 1
                                        }}>
                                        {enviando ? 'Enviando...' : 'Enviar feedback'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

const lblStyle = { fontSize: '12px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px', fontWeight: '500' }
const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    color: 'var(--color-text)', fontSize: '14px', outline: 'none'
}
const btnGhost = {
    background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '8px 16px',
    color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer'
}
const btnPrimario = {
    background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
    borderRadius: 'var(--radius-sm)', padding: '8px 20px',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer'
}
