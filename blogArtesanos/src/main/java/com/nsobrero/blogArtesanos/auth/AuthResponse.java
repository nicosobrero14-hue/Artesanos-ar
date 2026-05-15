package com.nsobrero.blogArtesanos.auth;

//Lo que devuelve la API después de un login o registro exitoso
public record AuthResponse(
     Long id,
     String token,
     String nombre,
     String email,
     String slug,
     String rol  // "USER" | "ADMIN"
) {}
