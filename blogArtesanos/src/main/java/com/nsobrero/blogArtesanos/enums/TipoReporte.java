package com.nsobrero.blogArtesanos.enums;

/*
 * Qué se está reportando.
 * Los IDs están desnormalizados (no FK) para que el reporte sobreviva
 * aunque se borre el contenido reportado — el admin igual quiere ver el caso.
 */
public enum TipoReporte {
    PIEZA,
    COMENTARIO,
    RESENA,
    ARTESANO
}
