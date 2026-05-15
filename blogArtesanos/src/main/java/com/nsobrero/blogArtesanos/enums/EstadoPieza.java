package com.nsobrero.blogArtesanos.enums;

/*
 * Un Enum es una lista fija de valores posibles.
 * En vez de guardar el estado como un String libre (donde alguien podría
 * escribir "disponible", "Disponible", "DISPONIBLE" y romper todo),
 * usamos un Enum que solo acepta estos cuatro valores exactos.
 * JPA guarda el nombre del enum como texto en la base de datos.
 */
public enum EstadoPieza {
    DISPONIBLE,
    VENDIDA,
    ENCARGO,
    RESERVADA
}
