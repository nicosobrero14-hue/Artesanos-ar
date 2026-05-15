package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDate;

/*
 * Vista admin de un artesano: todos los datos relevantes para el panel de control.
 * Incluye datos sensibles como email y rol que NO se exponen en ArtesanoPublicoDTO.
 */
public record ArtesanoAdminDTO(
    Long id,
    String nombre,
    String email,
    String slug,
    String plan,                  // "GRATIS" | "PREMIUM"
    Boolean esPremium,            // teniendo en cuenta la fecha de expiración
    LocalDate fechaExpiracionPlan,
    String rol,                   // "USER" | "ADMIN"
    Boolean verificado,
    Boolean activo,
    LocalDate fechaRegistro,
    long totalPiezas
) {}
