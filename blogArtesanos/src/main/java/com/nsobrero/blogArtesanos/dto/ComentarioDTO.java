package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDateTime;

public record ComentarioDTO(
        Long id,
        String texto,
        String autorNombre,
        Boolean esAnonimo,
        LocalDateTime fecha
) {}