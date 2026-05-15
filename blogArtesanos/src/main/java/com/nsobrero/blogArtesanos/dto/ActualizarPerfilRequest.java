package com.nsobrero.blogArtesanos.dto;


public record ActualizarPerfilRequest(
        String nombre,
        String bio,
        String ubicacion,
        String rubros,
        String instagram,
        String whatsapp
) {}