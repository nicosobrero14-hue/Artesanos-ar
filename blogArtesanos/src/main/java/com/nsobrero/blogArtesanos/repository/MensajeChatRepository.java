package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.MensajeChat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensajeChatRepository extends JpaRepository<MensajeChat, Long> {

    /* Mensajes de una conversación ordenados cronológicamente (oldest first para mostrar como chat). */
    List<MensajeChat> findByConversacionIdOrderByFechaAsc(Long conversacionId);

    /* Para "vaciar chat" o eliminar conversación entera. */
    void deleteByConversacionId(Long conversacionId);
}
