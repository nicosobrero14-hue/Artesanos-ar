package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;

public record ClienteRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,
        String email,
        String telefono,
        String notas
) {}