package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * "Me gusta" sobre una pieza.
 * Constraint único (pieza_id, autor_id) garantiza 1 like por usuario por pieza.
 *
 * Lo modelamos como entidad propia (en vez de un counter en Pieza) por dos razones:
 *  1. Saber QUIÉN dio like — útil para mostrar "ya te gusta" / toggle
 *  2. Permitir auditoría / ranking por persona en el futuro
 */
@Entity
@Table(name = "me_gusta",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pieza_id", "autor_id"}))
@Getter @Setter @NoArgsConstructor
public class MeGusta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pieza_id", nullable = false)
    private Pieza pieza;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
