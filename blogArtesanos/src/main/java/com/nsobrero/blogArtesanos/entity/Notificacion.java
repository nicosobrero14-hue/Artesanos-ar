package com.nsobrero.blogArtesanos.entity;

import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Notificación in-app dirigida a un artesano.
 *
 * Diseño minimalista:
 *  - destinatarioId: a quién le llega
 *  - tipo: para que el frontend muestre el icono correcto
 *  - mensaje: texto plano corto ya formateado en español
 *  - url: link relativo opcional al que llevar al click ("/panel/mensajes", etc.)
 *  - leida: para badge de pendientes
 *
 * Las notificaciones se generan en los services correspondientes:
 *  - ContactoService al recibir mensaje
 *  - ComentarioController al crear comentario
 *  - MeGustaController al crear like
 *  - ResenaController al crear reseña
 *  - EventoService al aprobar/sumar participante
 */
@Entity
@Table(name = "notificaciones",
       indexes = {
           @Index(name = "idx_notif_destinatario_leida",
                  columnList = "destinatario_id, leida")
       })
@Getter @Setter @NoArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "destinatario_id", nullable = false)
    private Long destinatarioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoNotificacion tipo;

    @Column(nullable = false, length = 500)
    private String mensaje;

    private String url;

    @Column(nullable = false)
    private Boolean leida = false;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
