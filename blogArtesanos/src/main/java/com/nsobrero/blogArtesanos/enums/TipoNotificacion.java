package com.nsobrero.blogArtesanos.enums;

public enum TipoNotificacion {
    COMENTARIO_NUEVO,        // alguien comentó tu pieza
    LIKE_NUEVO,              // alguien dio like a tu pieza
    RESENA_NUEVA,            // dejaron una reseña en tu artesano
    MENSAJE_CONTACTO,        // recibiste un mensaje de contacto
    EVENTO_APROBADO,         // tu evento fue aprobado
    EVENTO_PARTICIPANTE,     // alguien se sumó a tu evento
    PLAN_UPGRADE,            // te activaron premium
    PLAN_VENCE_PRONTO,       // tu premium vence en X días
    GENERICO                 // para mensajes manuales del admin
}
