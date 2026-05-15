package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDateTime;

public record ResenaDTO(
    Long id,
    Integer calificacion,
    String texto,
    String autorNombre,
    Long autorId,
    LocalDateTime fecha
) {}
