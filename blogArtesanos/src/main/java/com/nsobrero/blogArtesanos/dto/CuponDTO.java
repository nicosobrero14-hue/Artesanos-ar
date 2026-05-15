package com.nsobrero.blogArtesanos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/*
 * DTO de cupón. Incluye los IDs de las piezas asociadas para que el frontend
 * pueda mostrarlas en el form de edición y resaltar a cuáles aplica.
 *
 * Si piezasIds está vacío → cupón global (todas las piezas del artesano).
 */
public record CuponDTO(
    Long id,
    String codigo,
    Integer porcentaje,
    String descripcion,
    LocalDate fechaVencimiento,
    Boolean activo,
    Integer usosMax,
    Integer usosCantidad,
    LocalDateTime fechaCreacion,
    List<Long> piezasIds
) {}
