package com.nsobrero.blogArtesanos.dto;

public record ClienteDTO(
        Long id,
        String nombre,
        String email,
        String telefono,
        String notas
) {}