package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/*
 * Vista pública de un evento.
 * Incluye flags útiles para el frontend:
 *  - soyAutor: si el usuario logueado lo creó (puede editar/eliminar)
 *  - soyParticipante: si ya se sumó (toggle del botón "Voy a estar")
 */
public record EventoDTO(
    Long id,
    String nombre,
    String descripcion,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    String ubicacion,
    String urlMaps,
    LocalDateTime fechaCreacion,
    Boolean aprobado,
    String autorNombre,
    String autorSlug,
    Long autorId,
    int participantesCount,
    List<ParticipanteDTO> participantes,
    Boolean soyAutor,
    Boolean soyParticipante
) {
    public record ParticipanteDTO(Long id, String nombre, String slug, String avatarUrl) {}
}
