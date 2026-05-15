import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

/*
 * Botón de like reutilizable.
 *
 *  - Si el usuario está logueado y nunca dio like, muestra corazón vacío
 *  - Si ya dio like, muestra corazón rojo lleno
 *  - Sin auth: el corazón es read-only (al hacer click redirige al login)
 *
 * El componente se hidrata haciendo GET /me-gusta para saber el state actual.
 * Pasale `initialCount` si ya tenés el count en el padre para evitar el GET inicial.
 */
export default function BotonMeGusta({ piezaId, initialCount = null, size = 'md' }) {
    const { usuario } = useAuth()
    const [count, setCount] = useState(initialCount ?? 0)
    const [meGusta, setMeGusta] = useState(false)
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        // Si tenemos count inicial y no hay usuario, no hace falta consultar
        if (initialCount != null && !usuario) {
            setCount(initialCount)
            return
        }
        // Sino, consultamos para saber si el usuario actual dio like
        api.get(`/piezas/${piezaId}/me-gusta`)
            .then(res => {
                setCount(res.data.count)
                setMeGusta(res.data.meGusta)
            })
            .catch(() => {})
    }, [piezaId, usuario])

    const handleClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!usuario) {
            window.location.href = `/login?next=${window.location.pathname}`
            return
        }
        if (cargando) return

        setCargando(true)
        try {
            const { data } = await api.post(`/piezas/${piezaId}/me-gusta`)
            setCount(data.count)
            setMeGusta(data.meGusta)
        } catch (err) {
            console.error(err)
        } finally {
            setCargando(false)
        }
    }

    const sizes = {
        sm: { fontSize: '12px', padding: '4px 10px', iconSize: '14px' },
        md: { fontSize: '13px', padding: '6px 12px', iconSize: '16px' },
        lg: { fontSize: '14px', padding: '8px 16px', iconSize: '18px' }
    }
    const s = sizes[size]

    return (
        <button onClick={handleClick} disabled={cargando} style={{
            background: meGusta ? '#e05c5c18' : 'transparent',
            border: `1px solid ${meGusta ? '#e05c5c' : 'var(--color-border)'}`,
            borderRadius: '20px',
            padding: s.padding,
            color: meGusta ? '#e05c5c' : 'var(--color-text-2)',
            fontSize: s.fontSize,
            cursor: cargando ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
        }}>
            <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>
                {meGusta ? '♥' : '♡'}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        </button>
    )
}
