package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDateTime;
import java.util.List;

/*
 * DTOs del chat. Records anidados para no proliferar archivos.
 */
public class ChatDTO {

    /* Item de la lista de conversaciones del usuario logueado */
    public record ConversacionItemDTO(
        Long id,
        Long otroId,
        String otroNombre,
        String otroSlug,
        String otroAvatarUrl,
        String ultimoMensaje,
        Boolean ultimoLoEnvieYo,
        LocalDateTime ultimaActividad,
        Integer noLeidos,
        Boolean otroEsAdmin,
        Boolean respuestaHabilitada
    ) {}

    /* Mensaje individual al ver una conversación */
    public record MensajeDTO(
        Long id,
        Long autorId,
        String texto,
        LocalDateTime fecha,
        Boolean leido,
        Boolean esMio
    ) {}

    /* Detalle de una conversación con sus mensajes (al abrirla) */
    public record DetalleDTO(
        Long id,
        Long otroId,
        String otroNombre,
        String otroSlug,
        String otroAvatarUrl,
        List<MensajeDTO> mensajes,
        Boolean otroEsAdmin,
        Boolean respuestaHabilitada
    ) {}
}
