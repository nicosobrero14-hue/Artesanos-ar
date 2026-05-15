import { useState } from 'react'
import { optimizarCard, optimizarHero } from '../utils/cloudinary'

/*
 * Props:
 * - fotos: array de URLs
 * - titulo: string para el alt
 * - height: altura del carrusel en px
 * - onEliminar: función(indice) — si se pasa, muestra el botón de borrar
 *   Solo se usa en el panel privado, nunca en el catálogo público
 */
export default function CarruselFotos({ fotos = [], titulo = '', height = 180, onEliminar }) {
    const [indice, setIndice] = useState(0)
    const [visorAbierto, setVisorAbierto] = useState(false)

    // Si borramos la foto actual y era la última, retrocedemos el índice
    const handleEliminar = async (e) => {
        e.stopPropagation()
        if (!onEliminar) return
        await onEliminar(indice)
        setIndice(prev => (prev > 0 ? prev - 1 : 0))
    }

    const anterior = (e) => {
        e.stopPropagation()
        setIndice(prev => (prev === 0 ? fotos.length - 1 : prev - 1))
    }

    const siguiente = (e) => {
        e.stopPropagation()
        setIndice(prev => (prev === fotos.length - 1 ? 0 : prev + 1))
    }

    if (!fotos || fotos.length === 0) {
        return (
        <div style={{
            height, background: 'var(--color-bg-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px'
        }}>
            🔪
        </div>
        )
    }

    return (
        <>
        {/* Carrusel inline */}
        <div style={{ position: 'relative', height, overflow: 'hidden', background: 'var(--color-bg-3)' }}>

            <img
            src={optimizarCard(fotos[indice])}
            loading="lazy"
            alt={`${titulo} - foto ${indice + 1}`}
            onClick={() => setVisorAbierto(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
            />

            {fotos.length > 1 && (
            <>
                <button onClick={anterior} style={btnNavStyle('left')}>‹</button>
                <button onClick={siguiente} style={btnNavStyle('right')}>›</button>

                {/* Puntos indicadores */}
                <div style={{
                position: 'absolute', bottom: '8px', left: '50%',
                transform: 'translateX(-50%)', display: 'flex', gap: '5px'
                }}>
                {fotos.map((_, i) => (
                    <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setIndice(i) }}
                    style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        border: 'none', padding: 0, cursor: 'pointer',
                        background: i === indice ? 'white' : 'rgba(255,255,255,0.4)'
                    }}
                    />
                ))}
                </div>
            </>
            )}

            {/* Contador */}
            <span style={{
            position: 'absolute', top: '8px', right: onEliminar ? '36px' : '8px',
            background: 'rgba(0,0,0,0.55)', color: 'white',
            fontSize: '11px', padding: '2px 7px', borderRadius: '20px'
            }}>
            {indice + 1}/{fotos.length}
            </span>

            {/* Botón eliminar — solo si se pasó onEliminar */}
            {onEliminar && (
            <button
                onClick={handleEliminar}
                title="Eliminar esta foto"
                style={{
                position: 'absolute', top: '6px', right: '6px',
                background: 'rgba(200,0,0,0.75)', border: 'none',
                borderRadius: '50%', width: '24px', height: '24px',
                color: 'white', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1
                }}
            >
                ×
            </button>
            )}
        </div>

        {/* Visor ampliado */}
        {visorAbierto && (
            <Visor
            fotos={fotos}
            indiceInicial={indice}
            titulo={titulo}
            onClose={() => setVisorAbierto(false)}
            />
        )}
        </>
    )
    }

    /*
    * Visor ampliado con navegación por teclado y flechas.
    * Se monta en un portal sobre todo el resto de la página.
    */
    function Visor({ fotos, indiceInicial, titulo, onClose }) {
    const [idx, setIdx] = useState(indiceInicial)

    const anterior = (e) => { e?.stopPropagation(); setIdx(p => p === 0 ? fotos.length - 1 : p - 1) }
    const siguiente = (e) => { e?.stopPropagation(); setIdx(p => p === fotos.length - 1 ? 0 : p + 1) }

    // Navegación con teclado
    const handleKey = (e) => {
        if (e.key === 'ArrowLeft') anterior()
        if (e.key === 'ArrowRight') siguiente()
        if (e.key === 'Escape') onClose()
    }

    return (
        <div
        onClick={onClose}
        onKeyDown={handleKey}
        tabIndex={0}
        autoFocus
        style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        >
        {/* Imagen */}
        <img
            src={optimizarHero(fotos[idx])}
            alt={`${titulo} - foto ${idx + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
            maxWidth: '88vw', maxHeight: '88vh',
            objectFit: 'contain', borderRadius: '8px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
            }}
        />

        {/* Cerrar */}
        <button
            onClick={onClose}
            style={{
            position: 'fixed', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            borderRadius: '50%', width: '36px', height: '36px',
            color: 'white', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            ×
        </button>

        {/* Contador */}
        <span style={{
            position: 'fixed', bottom: '20px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: '13px', padding: '4px 14px', borderRadius: '20px'
        }}>
            {idx + 1} / {fotos.length}
        </span>

        {fotos.length > 1 && (
            <>
            <button onClick={anterior} style={btnNavStyle('left', true)}>‹</button>
            <button onClick={siguiente} style={btnNavStyle('right', true)}>›</button>
            </>
        )}
        </div>
    )
    }

    // Estilos reutilizables para botones de navegación
    function btnNavStyle(lado, grande = false) {
    return {
        position: 'absolute',
        [lado]: grande ? '16px' : '8px',
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.5)', border: 'none',
        borderRadius: '50%',
        width: grande ? '44px' : '28px',
        height: grande ? '44px' : '28px',
        color: 'white', cursor: 'pointer',
        fontSize: grande ? '24px' : '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
}