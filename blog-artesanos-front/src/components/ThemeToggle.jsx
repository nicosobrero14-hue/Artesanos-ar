import { useTheme } from '../hooks/useTheme'

/*
 * Botón para alternar entre modo claro y oscuro.
 * El estado vive en el hook useTheme (localStorage + data-theme en <html>).
 *
 * Props:
 * - size: 'sm' (28px, para navbars compactos) | 'md' (36px, default)
 */
export default function ThemeToggle({ size = 'md' }) {
    const { theme, toggle } = useTheme()
    const dim = size === 'sm' ? 28 : 36
    const iconSize = size === 'sm' ? 14 : 18

    return (
        <button
            onClick={toggle}
            className="btn-sm"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            style={{
                width: dim, height: dim, minHeight: dim,
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                padding: 0
            }}
        >
            {theme === 'dark' ? <IconSol size={iconSize} /> : <IconLuna size={iconSize} />}
        </button>
    )
}

function IconSol({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    )
}

function IconLuna({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    )
}
