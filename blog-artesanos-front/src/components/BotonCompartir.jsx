import { useState } from 'react'

/*
 * Botón de compartir reutilizable.
 *
 * Estrategia:
 *  1. Si el browser soporta navigator.share (móvil principalmente), usa el
 *     selector nativo del sistema operativo.
 *  2. Si no, copia la URL al portapapeles y muestra "Copiado ✓" por 2 segundos.
 */
export default function BotonCompartir({ titulo, texto, url, style }) {
    const [copiado, setCopiado] = useState(false)
    const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    const handleClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Web Share API (mobile principalmente)
        if (navigator.share) {
            try {
                await navigator.share({ title: titulo, text: texto, url: targetUrl })
                return
            } catch (err) {
                // El usuario canceló — no hacemos fallback
                if (err.name === 'AbortError') return
                // Otro error → caemos al copy
            }
        }

        // Fallback: copiar al portapapeles
        try {
            await navigator.clipboard.writeText(targetUrl)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        } catch {
            // Último recurso: prompt
            prompt('Copiá este link:', targetUrl)
        }
    }

    return (
        <button onClick={handleClick} style={{
            background: copiado ? 'var(--color-success)' : 'transparent',
            color: copiado ? '#0f0f0f' : 'var(--color-text-2)',
            border: `1px solid ${copiado ? 'var(--color-success)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
            ...style
        }}>
            {copiado ? '✓ Link copiado' : '↗ Compartir'}
        </button>
    )
}
