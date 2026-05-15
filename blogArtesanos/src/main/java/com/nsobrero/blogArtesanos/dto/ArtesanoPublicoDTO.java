package com.nsobrero.blogArtesanos.dto;

//Lo que devuelve el catálogo público — sin email, sin password
public record ArtesanoPublicoDTO(
     Long id,
     String nombre,
     String slug,
     String bio,
     String avatarUrl,
     String ubicacion,
     String rubros,
     String instagram,
     String whatsapp,
     // Para mostrar el badge "Premium" en las cards públicas
     Boolean esPremium
) {}
