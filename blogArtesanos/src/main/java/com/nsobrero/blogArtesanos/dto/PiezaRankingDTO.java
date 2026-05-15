package com.nsobrero.blogArtesanos.dto;

import java.math.BigDecimal;
import java.util.List;

/*
 * Item del ranking: una pieza con su score y posición.
 * El score es: likes * 1 + comentarios * 2 (los comentarios valen más).
 */
public record PiezaRankingDTO(
    int posicion,
    Long id,
    String titulo,
    BigDecimal precio,
    List<String> fotos,
    String artesanoNombre,
    String artesanoSlug,
    Boolean destacada,
    long likes,
    long comentarios,
    long score
) {}
