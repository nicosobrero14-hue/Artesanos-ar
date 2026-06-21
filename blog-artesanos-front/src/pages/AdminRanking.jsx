import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

/*
 * Admin: editar config del ranking — periodicidad, premio, fecha del próximo otorgamiento.
 * El otorgamiento es manual: cuando llega la fecha, el admin va a /admin (panel artesanos)
 * y le hace upgrade a Premium al #1 del ranking. Esta página configura qué se promete.
 */
const PERIODICIDADES = ['Semanal', 'Quincenal', 'Mensual']

export default function AdminRanking() {
    const { usuario } = useAuth()
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [ok, setOk] = useState(false)

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') cargar()
    }, [usuario])

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await api.get('/ranking/config')
            setConfig(res.data)
        } catch {
            alert('Error cargando configuración')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (campo, valor) => setConfig(c => ({ ...c, [campo]: valor }))

    const guardar = async () => {
        if (!config.descripcionPremio?.trim()) {
            alert('Ingresá una descripción del premio')
            return
        }
        setGuardando(true)
        setOk(false)
        try {
            const { data } = await api.put('/ranking/config', {
                periodicidad: config.periodicidad,
                descripcionPremio: config.descripcionPremio,
                reglasExtras: config.reglasExtras || '',
                activo: !!config.activo,
                fechaProximoOtorgamiento: config.fechaProximoOtorgamiento || null
            })
            setConfig(data)
            setOk(true)
            setTimeout(() => setOk(false), 2500)
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar')
        } finally {
            setGuardando(false)
        }
    }

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>🏆 Config del Ranking</h1>
                    <span style={{
                        background: 'var(--color-premium)', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Configurá qué premio se otorga al #1, cada cuánto y la fecha del próximo corte.
                    El otorgamiento es manual: cuando llegue la fecha, hacé upgrade desde /admin al ganador.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <Link to="/admin" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                        ← Volver al admin
                    </Link>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : !config ? (
                    <p style={{ color: 'var(--color-danger)' }}>No se pudo cargar la configuración</p>
                ) : (
                    <div style={{
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        padding: '28px',
                        display: 'flex', flexDirection: 'column', gap: '18px'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox"
                                checked={!!config.activo}
                                onChange={e => handleChange('activo', e.target.checked)} />
                            <span style={{ fontSize: '14px' }}>
                                <strong>Sistema de ranking activo</strong>
                                <span style={{ color: 'var(--color-text-3)', fontSize: '12px', marginLeft: '8px' }}>
                                    (si está apagado, no se muestra el premio en /ranking)
                                </span>
                            </span>
                        </label>

                        <div>
                            <label style={lblStyle}>Periodicidad</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {PERIODICIDADES.map(p => (
                                    <button key={p}
                                        onClick={() => handleChange('periodicidad', p)}
                                        style={{
                                            background: config.periodicidad === p ? 'var(--color-accent)' : 'transparent',
                                            color: config.periodicidad === p ? '#0f0f0f' : 'var(--color-text-2)',
                                            border: `1px solid ${config.periodicidad === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            borderRadius: '20px', padding: '7px 16px',
                                            fontSize: '13px', cursor: 'pointer'
                                        }}>{p}</button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={lblStyle}>Premio del #1</label>
                            <input
                                value={config.descripcionPremio || ''}
                                onChange={e => handleChange('descripcionPremio', e.target.value)}
                                placeholder="Ej: 1 mes de Premium gratis"
                                maxLength={500}
                                style={inputStyle} />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                                Esto se muestra en la página pública /ranking.
                            </p>
                        </div>

                        <div>
                            <label style={lblStyle}>Fecha del próximo otorgamiento</label>
                            <input type="date"
                                value={config.fechaProximoOtorgamiento || ''}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => handleChange('fechaProximoOtorgamiento', e.target.value)}
                                style={inputStyle} />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                                Cuando llegue, hacé upgrade manual al #1 desde el panel admin.
                            </p>
                        </div>

                        <div>
                            <label style={lblStyle}>Reglas extras (opcional)</label>
                            <textarea
                                value={config.reglasExtras || ''}
                                onChange={e => handleChange('reglasExtras', e.target.value)}
                                rows={4}
                                placeholder="Cómo se calcula el score, restricciones, aclaraciones..."
                                style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                            {ok && <span style={{ color: 'var(--color-success)', fontSize: '13px' }}>✓ Guardado</span>}
                            <button onClick={guardar} disabled={guardando}
                                style={{
                                    background: 'var(--color-accent)', color: '#0f0f0f',
                                    border: 'none', borderRadius: 'var(--radius-sm)',
                                    padding: '10px 22px', fontSize: '14px', fontWeight: '600',
                                    cursor: 'pointer', opacity: guardando ? 0.6 : 1
                                }}>
                                {guardando ? 'Guardando...' : 'Guardar configuración'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const lblStyle = { fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '8px', fontWeight: '500' }
const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    color: 'var(--color-text)', fontSize: '14px', outline: 'none'
}
