package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Feedback enviado por usuarios (logueados o anónimos).
 * Tipos típicos: bug report, feature request, comentario general.
 *
 * Se persiste en DB Y se envía por email al admin para tener doble respaldo.
 * Si falla el email, queda en DB; si falla la DB, el endpoint devuelve error
 * y el usuario sabe que no llegó.
 */
@Entity
@Table(name = "feedbacks")
@Getter @Setter @NoArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Categoría libre: "Bug", "Mejora", "Pregunta", etc.
     * El frontend ofrece opciones predefinidas pero permitimos free-text
     * para no encorsetar.
     */
    @Column(length = 50)
    private String tipo;

    @Column(nullable = false, length = 2000)
    private String mensaje;

    /*
     * Si el usuario está logueado guardamos su id+nombre.
     * Si es anónimo, autorId es null y autorNombre puede ser lo que ponga
     * en el form (o null si no pone nada).
     */
    private Long autorId;
    private String autorNombre;
    private String autorEmail;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean leido = false;

    private LocalDateTime leidoEl;
}
