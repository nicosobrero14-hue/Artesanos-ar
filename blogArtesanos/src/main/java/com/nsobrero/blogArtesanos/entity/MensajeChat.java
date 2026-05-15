package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensajes_chat",
       indexes = @Index(name = "idx_msg_conv_fecha", columnList = "conversacion_id, fecha"))
@Getter @Setter @NoArgsConstructor
public class MensajeChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversacion_id", nullable = false)
    private Long conversacionId;

    @Column(name = "autor_id", nullable = false)
    private Long autorId;

    @Column(nullable = false, length = 2000)
    private String texto;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean leido = false;
}
