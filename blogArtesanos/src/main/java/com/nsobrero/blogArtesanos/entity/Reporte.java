package com.nsobrero.blogArtesanos.entity;

import com.nsobrero.blogArtesanos.enums.TipoReporte;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Reporte de contenido inapropiado.
 *
 * Diseñado para sobrevivir al borrado del contenido reportado:
 * - tipo + objetoId guardan QUÉ se reportó (sin FK, son denormalizados a propósito)
 * - reporteUrl guarda un link relativo para que el admin pueda navegar al contexto
 *   incluso si el id ya no existe
 *
 * Estado simple: pendiente o resuelto. El admin marca como resuelto cuando actuó
 * (eliminó el contenido, baneó la cuenta, lo descartó como spam, etc.).
 */
@Entity
@Table(name = "reportes")
@Getter @Setter @NoArgsConstructor
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoReporte tipo;

    @Column(nullable = false)
    private Long objetoId;

    /* URL de la pantalla donde el admin puede ver el contexto. Ej: /artesano/x/pieza/123 */
    private String reporteUrl;

    @Column(nullable = false, length = 500)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(nullable = false)
    private String autorNombre;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean resuelto = false;

    private LocalDateTime resueltoEl;

    private String notaAdmin;
}
