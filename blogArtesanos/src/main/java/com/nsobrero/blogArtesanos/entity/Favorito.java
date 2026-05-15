package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Pieza guardada como favorita por un usuario (modelo "guardar para después").
 *
 * Distinto del "Me gusta" (MeGusta) que es público y suma al ranking:
 *  - Favorito = privado, solo lo ve el usuario
 *  - MeGusta = público, suma engagement
 *
 * Constraint único (pieza_id, autor_id) → 1 favorito por usuario por pieza.
 */
@Entity
@Table(name = "favoritos",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pieza_id", "autor_id"}))
@Getter @Setter @NoArgsConstructor
public class Favorito {

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
