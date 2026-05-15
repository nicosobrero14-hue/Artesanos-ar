package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.nsobrero.blogArtesanos.enums.EstadoPedido;

@Entity
@Table(name = "pedidos")
@Getter @Setter @NoArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion; // Ej: "Facón gaucho, mango en quebracho, vaina de cuero"

    @Column(precision = 10, scale = 2)
    private BigDecimal precioAcordado;

    // La seña es el anticipo que pagó el cliente
    @Column(precision = 10, scale = 2)
    private BigDecimal senia = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @Column(nullable = false)
    private LocalDate fechaEncargo = LocalDate.now();

    // Fecha estimada de entrega que le decís al cliente
    private LocalDate fechaEntregaEstimada;

    @Column(columnDefinition = "TEXT")
    private String notas; // Notas privadas del artesano

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artesano_id", nullable = false)
    private Artesano artesano;
}