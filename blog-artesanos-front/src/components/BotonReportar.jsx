import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/*
 * Botón discreto "🚩 Reportar" + modal con motivos predefinidos.
 *
 * Tipos válidos: PIEZA, COMENTARIO, RESENA, ARTESANO
 *
 * Si no está logueado, redirige a login.
 */
const MOTIVOS = [
    'Spam o publicidad',
    'Contenido falso',
    'Lenguaje ofensivo',
    'Imagen inapropiada',
    'Plagio de otra obra',
    'Otro'
]

export default function BotonReportar({ tipo, objetoId, sutil = false }) {
    const { usuario } = useAuth()
    const toast = useToast()
    const [abierto, setAbierto] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [detalle, setDetalle] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)

    const handleAbrir = (e) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (!usuario) {
            window.location.href = `/login?next=${window.location.pathname}`
            return
        }
        setAbierto(true)
        setMotivo('')
        setDetalle('')
        setEnviado(false)
    }

    const handleEnviar = async (e) => {
        e.preventDefault()
        if (!motivo) return
        setEnviando(true)
        try {
            await api.post('/reportes', {
                tipo, objetoId,
                motivo, detalle,
                url: window.location.pathname
            })
            setEnviado(true)
            setTimeout(() => setAbierto(false), 1800)
        } catch (err) {
            toast(err.response?.data?.message || 'Error al enviar el reporte', 'error')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <>
            <button onClick={handleAbrir} title="Reportar contenido inapropiado"
                style={sutil ? sutilStyle : visibleStyle}>
                🚩 Reportar
            </button>

            {abierto && (
                <div onClick={() => setAbierto(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px'
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        padding: '24px',
                        maxWidth: '440px', width: '100%'
                    }}>
                        {enviado ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
                                <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
                                    Reporte enviado
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                    Lo vamos a revisar a la brevedad.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleEnviar}>
                                <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px' }}>
                                    Reportar contenido
                                </h2>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '18px' }}>
                                    Cuanto más detalle des, más rápido lo resolvemos.
                                </p>

                                <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Motivo *
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                    {MOTIVOS.map(m => (
                                        <label key={m} style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                            background: motivo === m ? 'var(--color-bg-3)' : 'transparent',
                                            border: `1px solid ${motivo === m ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            cursor: 'pointer', fontSize: '13px'
                                        }}>
                                            <input type="radio" name="motivo" value={m}
                                                checked={motivo === m}
                                                onChange={() => setMotivo(m)} />
                                            {m}
                                        </label>
                                    ))}
                                </div>

                                <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                                    Detalles (opcional)
                                </label>
                                <textarea value={detalle} onChange={e => setDetalle(e.target.value)}
                                    rows={3} maxLength={1000}
                                    placeholder="Contanos qué pasa..."
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'var(--color-bg-3)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                                        color: 'var(--color-text)', fontSize: '13px',
                                        outline: 'none', resize: 'vertical'
                                    }} />

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                                    <button type="button" onClick={() => setAbierto(false)}
                                        style={{
                                            background: 'transparent', border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                                            color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer'
                                        }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={enviando || !motivo}
                                        style={{
                                            background: motivo ? 'var(--color-danger)' : 'var(--color-bg-3)',
                                            color: motivo ? 'white' : 'var(--color-text-3)',
                                            border: 'none', borderRadius: 'var(--radius-sm)',
                                            padding: '8px 18px', fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: motivo ? 'pointer' : 'not-allowed',
                                            opacity: enviando ? 0.6 : 1
                                        }}>
                                        {enviando ? 'Enviando...' : 'Reportar'}
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

const visibleStyle = {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 10px',
    color: 'var(--color-text-3)',
    fontSize: '11px',
    cursor: 'pointer'
}

const sutilStyle = {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-3)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '4px 6px',
    opacity: 0.5
}
