import { useState } from 'react'
import api from '../api/axios'

/*
 * Modal con formulario para crear o editar un evento.
 * Si recibe `evento`, está en modo edición; sino crea uno nuevo.
 */
export default function EventoForm({ evento, onClose, onSaved }) {
    const esEdicion = !!evento

    const [form, setForm] = useState({
        nombre: evento?.nombre || '',
        descripcion: evento?.descripcion || '',
        fechaInicio: evento?.fechaInicio || '',
        fechaFin: evento?.fechaFin || '',
        ubicacion: evento?.ubicacion || '',
        urlMaps: evento?.urlMaps || ''
    })
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState('')

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')

        if (form.fechaFin < form.fechaInicio) {
            setError('La fecha de fin no puede ser anterior a la de inicio')
            return
        }

        setEnviando(true)
        try {
            const { data } = esEdicion
                ? await api.put(`/eventos/${evento.id}`, form)
                : await api.post('/eventos', form)
            onSaved?.(data)
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el evento')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '28px',
                maxWidth: '520px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>
                    {esEdicion ? 'Editar evento' : 'Crear nuevo evento'}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '20px' }}>
                    {esEdicion
                        ? 'Después de editar volverá a moderación del admin.'
                        : 'Tu evento queda pendiente hasta que el admin lo apruebe (24hs).'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Field label="Nombre del evento *">
                        <input required name="nombre" value={form.nombre} onChange={handleChange}
                            placeholder="Ej: Feria del Cuchillo Artesanal"
                            maxLength={120} style={inputStyle} />
                    </Field>

                    <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Field label="Fecha inicio *">
                            <input required type="date" name="fechaInicio"
                                value={form.fechaInicio} onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                style={inputStyle} />
                        </Field>
                        <Field label="Fecha fin *">
                            <input required type="date" name="fechaFin"
                                value={form.fechaFin} onChange={handleChange}
                                min={form.fechaInicio || new Date().toISOString().split('T')[0]}
                                style={inputStyle} />
                        </Field>
                    </div>

                    <Field label="Ubicación *">
                        <input required name="ubicacion" value={form.ubicacion} onChange={handleChange}
                            placeholder="Ej: Plaza San Martín, Rafaela, Santa Fe"
                            maxLength={200} style={inputStyle} />
                    </Field>

                    <Field label="URL de Google Maps (opcional)" hint="Para que pongan 'Ver mapa' clickeable">
                        <input name="urlMaps" value={form.urlMaps} onChange={handleChange}
                            placeholder="https://maps.google.com/..."
                            maxLength={500} style={inputStyle} />
                    </Field>

                    <Field label="Descripción" hint="Qué hay, horarios, costo de entrada, etc.">
                        <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                            rows={4} maxLength={2000}
                            placeholder="Detalles del evento..."
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </Field>

                    {error && (
                        <p style={{
                            color: 'var(--color-danger)', fontSize: '13px',
                            background: '#e05c5c18', padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)', border: '1px solid #e05c5c33'
                        }}>{error}</p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} style={{
                            background: 'transparent', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '9px 18px',
                            color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer'
                        }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={enviando} style={{
                            background: 'var(--color-accent)', color: '#0f0f0f',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            padding: '9px 22px', fontSize: '13px',
                            fontWeight: '600', cursor: 'pointer',
                            opacity: enviando ? 0.6 : 1
                        }}>
                            {enviando ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Crear evento')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const inputStyle = {
    width: '100%',
    background: 'var(--color-bg-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    color: 'var(--color-text)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                {label}
            </label>
            {children}
            {hint && (
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                    {hint}
                </p>
            )}
        </div>
    )
}
