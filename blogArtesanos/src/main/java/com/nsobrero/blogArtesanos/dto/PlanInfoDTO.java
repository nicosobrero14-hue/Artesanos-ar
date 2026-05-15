package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDate;

/*
 * Info del plan que se muestra en el panel del artesano.
 * Sirve para que el frontend pueda mostrar:
 *  - Qué plan tiene
 *  - Cuántas piezas/fotos puede subir
 *  - Cuántas piezas tiene actualmente (para mostrar X/10)
 *  - Si puede destacar piezas
 */
public record PlanInfoDTO(
    String plan,                  // "GRATIS" | "PREMIUM"
    Boolean esPremium,            // true si está activo (no expiró)
    LocalDate fechaExpiracionPlan,
    Integer maxPiezas,            // null = ilimitado
    Integer maxFotosPorPieza,
    Boolean puedeDestacar,
    long piezasActuales
) {}
