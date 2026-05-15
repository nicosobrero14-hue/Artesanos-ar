package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import com.nsobrero.blogArtesanos.enums.Oficio;

// Lo que recibe la API cuando el artesano crea o edita una pieza
public record PiezaRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 120, message = "El título no puede tener más de 120 caracteres")
        String titulo,

        @Size(max = 2000, message = "La descripción no puede tener más de 2000 caracteres")
        String descripcion,

        @NotNull @Positive(message = "El precio debe ser mayor a cero")
        BigDecimal precio,

        EstadoPieza estado,

        @NotNull(message = "El oficio es obligatorio")
        Oficio oficio,

        Integer horasTrabajo,
        String categoria,
        Boolean destacada,
        List<Long> materialIds  // IDs de los materiales que usa esta pieza
) {}
