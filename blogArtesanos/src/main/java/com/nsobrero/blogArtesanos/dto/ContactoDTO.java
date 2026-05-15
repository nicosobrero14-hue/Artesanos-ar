package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDateTime;

public record ContactoDTO(
        Long id,
        String nombre,
        String email,
        String mensaje,
        Long piezaId,
        Boolean leido,
        LocalDateTime fecha
) {}