package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PedidoRequest(
        @NotBlank String descripcion,
        BigDecimal precioAcordado,
        BigDecimal senia,
        LocalDate fechaEntregaEstimada,
        String notas,
        Long clienteId  // Si ya existe el cliente en el sistema
) {}
