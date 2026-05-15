package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "comentarios")
@Getter @Setter @NoArgsConstructor
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    // Nombre visible del que comenta
    @Column(nullable = false)
    private String autorNombre;

    /*
     * Si el comentario lo hace un artesano registrado guardamos su id.
     * Si lo hace un visitante anónimo este campo es null.
     * Así sabemos si fue verificado o no.
     */
    private Long autorId;

    private Boolean esAnonimo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pieza_id", nullable = false)
    private Pieza pieza;
}
