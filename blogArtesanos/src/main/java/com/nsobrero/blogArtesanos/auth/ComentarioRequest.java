package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComentarioRequest(
        @NotBlank(message = "El comentario no puede estar vacio")
        @Size(max = 500, message = "Maximo 500 caracteres")
        String texto,

        // Solo se usa si el usuario no está logueado
        String autorNombre
) {}
