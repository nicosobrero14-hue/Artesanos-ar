package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;

//Lo que manda el visitante desde el catálogo público
public record ContactoRequest(
     @NotBlank(message = "El nombre es obligatorio") String nombre,
     String email,
     @NotBlank(message = "El mensaje no puede estar vacío") String mensaje,
     Long piezaId  // Opcional: si consultó sobre una pieza específica
) {}
