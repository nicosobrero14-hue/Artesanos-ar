package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EventoRequest(
    @NotBlank @Size(max = 120) String nombre,
    @Size(max = 2000) String descripcion,
    @NotNull LocalDate fechaInicio,
    @NotNull LocalDate fechaFin,
    @NotBlank @Size(max = 200) String ubicacion,
    @Size(max = 500) String urlMaps
) {}
