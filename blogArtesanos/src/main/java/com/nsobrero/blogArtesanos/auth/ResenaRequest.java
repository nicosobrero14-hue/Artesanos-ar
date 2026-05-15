package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResenaRequest(
    @NotNull @Min(1) @Max(5) 
    Integer calificacion,
    @Size(max = 1000) 
    String texto
) {}
