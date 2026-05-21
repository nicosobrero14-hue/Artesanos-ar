package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.ChatDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * Endpoints del chat. Todos requieren auth.
 *
 *  - GET /api/chat                                — lista mis conversaciones
 *  - GET /api/chat/no-leidos                      — total no leídos (badge global)
 *  - GET /api/chat/con/{otroId}                   — abre/crea convo + mensajes
 *  - GET /api/chat/{id}/mensajes?desde=X          — polling de mensajes nuevos
 *  - POST /api/chat/{id}/mensajes                 — enviar mensaje
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatDTO.ConversacionItemDTO>> mias(
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(chatService.listarMias(artesano.getId()));
    }

    @GetMapping("/no-leidos")
    public ResponseEntity<Map<String, Long>> noLeidos(
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(Map.of("count", chatService.countNoLeidos(artesano.getId())));
    }

    @GetMapping("/con/{otroId}")
    public ResponseEntity<ChatDTO.DetalleDTO> abrir(
            @PathVariable Long otroId,
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(chatService.abrirConversacion(artesano.getId(), otroId));
    }

    @GetMapping("/{id}/mensajes")
    public ResponseEntity<Map<String, Object>> nuevos(
            @PathVariable Long id,
            @RequestParam(required = false) Long desde,
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(chatService.nuevosMensajes(artesano.getId(), id, desde));
    }

    @PostMapping("/{id}/mensajes")
    public ResponseEntity<ChatDTO.MensajeDTO> enviar(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(
            chatService.enviarMensaje(artesano.getId(), id, body.get("texto"))
        );
    }

    /*
     * DELETE /api/chat/{id}/mensajes — vaciar el chat (borrar todos los mensajes
     * pero mantener la conversación). Afecta a ambos participantes.
     */
    @DeleteMapping("/{id}/mensajes")
    public ResponseEntity<Map<String, String>> vaciar(
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano artesano) {
        chatService.vaciarChat(artesano.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Chat vaciado"));
    }

    /*
     * DELETE /api/chat/{id} — eliminar la conversación.
     * Si involucra a un admin: soft-delete (solo se oculta del lado del que pide).
     * Si es entre usuarios regulares: borrado bilateral.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano artesano) {
        chatService.eliminarConversacion(artesano.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Conversación eliminada"));
    }

    /*
     * POST /api/chat/{id}/toggle-respuesta — solo admin.
     * Habilita/deshabilita las respuestas del usuario en una conversación admin↔usuario.
     */
    @PostMapping("/{id}/toggle-respuesta")
    public ResponseEntity<Map<String, Object>> toggleRespuesta(
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano artesano) {
        boolean nuevo = chatService.toggleRespuestaHabilitada(artesano.getId(), id);
        return ResponseEntity.ok(Map.of("respuestaHabilitada", nuevo));
    }
}
