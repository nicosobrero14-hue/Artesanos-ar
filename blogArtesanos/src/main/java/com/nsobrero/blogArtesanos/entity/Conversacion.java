package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Conversación 1-1 entre dos artesanos.
 *
 * Diseño:
 *  - Los IDs de los participantes los guardamos ordenados (participante_a < participante_b)
 *    para que sea fácil garantizar que solo exista UNA conversación entre cada par.
 *  - ultimoMensaje y ultimaActividad para mostrar previews en la lista de chats sin
 *    necesidad de subqueries.
 *
 * Polling: el frontend hace GET /api/chat cada 10-15s para refrescar la lista.
 * Los mensajes individuales se traen on-demand al abrir una conversación.
 */
@Entity
@Table(name = "conversaciones",
       uniqueConstraints = @UniqueConstraint(columnNames = {"participante_a_id", "participante_b_id"}))
@Getter @Setter @NoArgsConstructor
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "participante_a_id", nullable = false)
    private Long participanteAId;

    @Column(name = "participante_b_id", nullable = false)
    private Long participanteBId;

    /* Snapshot del último mensaje para mostrar en la lista de chats. */
    @Column(length = 200)
    private String ultimoMensaje;

    /* Quién mandó el último mensaje — útil para mostrar "vos:" o el nombre del otro. */
    private Long ultimoMensajeAutorId;

    @Column(nullable = false)
    private LocalDateTime ultimaActividad = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    /*
     * Contadores de no-leídos por participante. Se incrementa cuando llega un mensaje
     * del otro, se resetea cuando el destinatario abre el chat.
     */
    @Column(nullable = false)
    private Integer noLeidosA = 0;

    @Column(nullable = false)
    private Integer noLeidosB = 0;

    /*
     * Si false, los participantes que NO son admin no pueden enviar mensajes.
     * Cuando un admin inicia una conversación, por defecto queda en false
     * (el usuario solo puede leer). El admin puede habilitar la respuesta
     * con un toggle desde su panel.
     * Para conversaciones entre usuarios normales, siempre true.
     */
    @Column(nullable = false)
    private Boolean respuestaHabilitada = true;

    /*
     * Soft-delete por usuario. Cada participante puede ocultar la conversación
     * de su panel sin afectar al otro. Si llega un mensaje nuevo, se "des-oculta"
     * automáticamente para que vuelva a aparecer.
     */
    @Column(nullable = false)
    private Boolean ocultaParaA = false;

    @Column(nullable = false)
    private Boolean ocultaParaB = false;

    /*
     * Helper: dado el id de un usuario que es parte de la conversación,
     * devuelve el id del otro.
     */
    public Long getOtroParticipante(Long miId) {
        return participanteAId.equals(miId) ? participanteBId : participanteAId;
    }

    public boolean esParticipante(Long id) {
        return participanteAId.equals(id) || participanteBId.equals(id);
    }

    /* Helpers para el soft-delete por usuario. */
    public boolean isOcultaPara(Long userId) {
        if (participanteAId.equals(userId)) return Boolean.TRUE.equals(ocultaParaA);
        if (participanteBId.equals(userId)) return Boolean.TRUE.equals(ocultaParaB);
        return false;
    }

    public void setOcultaPara(Long userId, boolean valor) {
        if (participanteAId.equals(userId)) ocultaParaA = valor;
        else if (participanteBId.equals(userId)) ocultaParaB = valor;
    }
}
