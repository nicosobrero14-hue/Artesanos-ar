package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "contactos")
@Getter @Setter @NoArgsConstructor
public class Contacto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String nombre;

    private String email;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String mensaje;

    // Si el visitante consultó sobre una pieza específica, guardamos su id.
    // Es nullable porque puede ser una consulta general sin pieza específica.
    private Long piezaId;

    @Column(nullable = false)
    private Boolean leido = false;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artesano_id", nullable = false)
    private Artesano artesano;
}