package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Feedback;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.FeedbackRepository;
import com.nsobrero.blogArtesanos.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/*
 * Endpoints de feedback. POST es público (cualquiera puede mandar feedback);
 * GET y delete son solo admin.
 *
 * El backup por email es best-effort: si el email falla, igual se guarda en DB
 * y el endpoint devuelve OK (no queremos frustrar al usuario que pierde su feedback).
 */
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final EmailService emailService;

    @Value("${app.admin-email}")
    private String adminEmail;

    @PostMapping
    @Transactional
    public ResponseEntity<?> crear(@RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal Artesano usuario) {
        String mensaje = body.get("mensaje");
        if (mensaje == null || mensaje.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El mensaje es obligatorio"));
        }
        if (mensaje.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Máximo 2000 caracteres"));
        }

        Feedback f = new Feedback();
        f.setTipo(body.get("tipo"));
        f.setMensaje(mensaje);

        if (usuario != null) {
            f.setAutorId(usuario.getId());
            f.setAutorNombre(usuario.getNombre());
            f.setAutorEmail(usuario.getEmail());
        } else {
            // Anónimo — pero permitimos opcionalmente que ingresen nombre/email
            f.setAutorNombre(body.get("autorNombre"));
            f.setAutorEmail(body.get("autorEmail"));
        }

        Feedback guardado = feedbackRepository.save(f);

        // Best-effort: si el email falla no afecta al usuario
        try {
            emailService.enviarFeedbackAlAdmin(
                adminEmail, guardado.getTipo(), guardado.getMensaje(),
                guardado.getAutorNombre(), guardado.getAutorEmail()
            );
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FeedbackController.class)
                .warn("Error al enviar feedback por email", e);
        }

        return ResponseEntity.ok(Map.of("message", "Gracias por tu feedback. Lo vamos a revisar."));
    }

    @GetMapping
    public ResponseEntity<?> listar(@AuthenticationPrincipal Artesano usuario) {
        if (usuario == null || usuario.getRol() != RolUsuario.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        }
        return ResponseEntity.ok(feedbackRepository.findAllByOrderByFechaDesc());
    }

    @GetMapping("/no-leidos")
    public ResponseEntity<?> noLeidos(@AuthenticationPrincipal Artesano usuario) {
        if (usuario == null || usuario.getRol() != RolUsuario.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        }
        return ResponseEntity.ok(Map.of("count", feedbackRepository.countByLeidoFalse()));
    }

    @PostMapping("/{id}/marcar-leido")
    @Transactional
    public ResponseEntity<?> marcarLeido(@PathVariable Long id,
                                         @AuthenticationPrincipal Artesano usuario) {
        if (usuario == null || usuario.getRol() != RolUsuario.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        }
        Feedback f = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback no encontrado"));
        f.setLeido(true);
        f.setLeidoEl(LocalDateTime.now());
        feedbackRepository.save(f);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminar(@PathVariable Long id,
                                      @AuthenticationPrincipal Artesano usuario) {
        if (usuario == null || usuario.getRol() != RolUsuario.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        }
        feedbackRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
