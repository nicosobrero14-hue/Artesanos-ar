package com.nsobrero.blogArtesanos.dto;

import java.util.List;

/*
 * Estadísticas avanzadas del panel premium.
 * Datos calculados sobre las entidades existentes (likes, comentarios, contactos, reseñas).
 *
 * No tracking de visitas todavía — eso requeriría agregar una entidad de eventos
 * con timestamp por cada visita y es scope grande. Para v1 estos números ya son útiles.
 */
public record StatsAvanzadasDTO(
    long totalLikesRecibidos,
    long totalComentariosRecibidos,
    long totalResenasRecibidas,
    Double promedioResenas,
    long totalMensajesContacto,
    long totalEventosCreados,
    long totalParticipantesEnEventos,
    PiezaTopDTO piezaTop,           // pieza con más engagement
    List<PiezaTopDTO> top5Piezas    // top 5 por score
) {
    public record PiezaTopDTO(
        Long id, String titulo, long likes, long comentarios, long score
    ) {}
}
