/*
 * Set de iconos de línea (stroke) para reemplazar emojis en la navegación
 * y acciones principales. Todos comparten el mismo grid 24x24 y heredan el
 * color con currentColor, así que se tiñen solos según el contexto.
 *
 * Uso: <Icon name="chat" size={16} />
 *
 * Mantener el set chico y consistente — si falta uno, agregarlo acá y no
 * volver a meter un emoji suelto.
 */
const paths = {
    home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
    sparkle: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />,
    grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
    box: <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />,
    clipboard: <path d="M9 4h6v3H9zM8 4H6v16h12V4h-2M9 11h6M9 15h4" />,
    chat: <path d="M4 5h16v11H8l-4 4V5z" />,
    users: <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5" />,
    calendar: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
    ticket: <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7zM14 7v10" />,
    trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M10 15h4M9 20h6M12 15v5" />,
    gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2z" />,
    chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
    bookmark: <path d="M6 4h12v16l-6-4-6 4V4z" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />,
    star: <path d="M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 21.3l1.6-6.6L2.6 9.8l6.8-.5L12 3z" />
}

export default function Icon({ name, size = 18, strokeWidth = 1.8, style, ...props }) {
    const d = paths[name]
    if (!d) return null
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0, ...style }}
            {...props}
        >
            {d}
        </svg>
    )
}
