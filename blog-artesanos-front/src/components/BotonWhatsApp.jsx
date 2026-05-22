/*
 * Botón de WhatsApp reutilizable. Dos modos:
 *
 *  1. Contacto directo (numero presente):
 *     abre el chat de WhatsApp del artesano con un mensaje pre-armado.
 *     Uso: "Consultar por WhatsApp" en una pieza.
 *
 *  2. Compartir (numero ausente):
 *     abre WhatsApp con el texto listo para que el usuario elija a quién
 *     mandárselo — un contacto, un grupo o su estado.
 *     Uso: "Compartir catálogo por WhatsApp".
 *
 * El número se limpia de todo lo que no sea dígito (espacios, +, guiones).
 */
export default function BotonWhatsApp({ numero, texto, label, style }) {
    const soloDigitos = numero ? String(numero).replace(/\D/g, '') : ''
    const href = soloDigitos
        ? `https://wa.me/${soloDigitos}?text=${encodeURIComponent(texto || '')}`
        : `https://wa.me/?text=${encodeURIComponent(texto || '')}`

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: '7px',
                background: '#25D366',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                ...style
            }}
        >
            {/* Ícono WhatsApp simple */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.2 4.43c-.15 0-.4.06-.6.29-.21.23-.8.78-.8 1.9 0 1.12.82 2.2.93 2.36.12.15 1.6 2.44 3.88 3.42.54.23.96.37 1.29.48.54.17 1.04.15 1.43.09.43-.07 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.06-.09-.21-.15-.44-.27-.23-.11-1.34-.66-1.55-.73-.21-.08-.36-.12-.51.11-.15.23-.58.73-.72.88-.13.15-.26.17-.49.06-.23-.12-.97-.36-1.85-1.14-.69-.61-1.15-1.37-1.28-1.6-.13-.23-.01-.35.1-.47.1-.1.23-.26.34-.4.12-.13.15-.22.23-.37.08-.15.04-.29-.02-.4-.06-.12-.51-1.24-.71-1.69-.18-.44-.37-.38-.51-.39-.13 0-.28-.01-.43-.01Z" />
            </svg>
            {label}
        </a>
    )
}
