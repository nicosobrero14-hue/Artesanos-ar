package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Reseña de un usuario sobre un artesano (no sobre una pieza).
 * Modelo "Te recomiendo a este maker" con calificación de 1-5 estrellas.
 *
 * Constraint único (autor_id, artesano_id) → 1 reseña por usuario por artesano.
 */
@Entity
@Table(name = "resenas",
       uniqueConstraints = @UniqueConstraint(columnNames = {"autor_id", "artesano_id"}))
@Getter @Setter @NoArgsConstructor
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer calificacion;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(nullable = false)
    private String autorNombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artesano_id", nullable = false)
    private Artesano artesano;
}
