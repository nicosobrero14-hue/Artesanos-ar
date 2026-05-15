package com.nsobrero.blogArtesanos.dto;

import com.nsobrero.blogArtesanos.enums.EstadoPedido;

import java.math.BigDecimal;
import java.time.LocalDate;

/*
 * DTO de Pedido. Necesario porque la entity tiene @ManyToOne(LAZY) a Artesano
 * y a Cliente — Jackson tiraba LazyInitializationException al serializar.
 *
 * Aplanamos los datos del cliente para que el frontend pueda mostrarlos sin
 * necesitar otra request.
 */
public record PedidoDTO(
    Long id,
    String descripcion,
    BigDecimal precioAcordado,
    BigDecimal senia,
    EstadoPedido estado,
    LocalDate fechaEncargo,
    LocalDate fechaEntregaEstimada,
    String notas,
    Long clienteId,
    String clienteNombre
) {}
