package com.nsobrero.blogArtesanos.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nsobrero.blogArtesanos.auth.AuthResponse;
import com.nsobrero.blogArtesanos.auth.LoginRequest;
import com.nsobrero.blogArtesanos.auth.RegisterRequest;
import com.nsobrero.blogArtesanos.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /*
     * El registro ya no devuelve un token — el artesano primero
     * tiene que verificar su email antes de poder loguearse.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of(
            "mensaje", "Registro exitoso. Revisá tu email para activar tu cuenta."
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // El frontend manda el token que viene en la URL del email
    @GetMapping("/verificar")
    public ResponseEntity<Map<String, String>> verificar(@RequestParam String token) {
        authService.verificarCuenta(token);
        return ResponseEntity.ok(Map.of("mensaje", "Cuenta activada correctamente"));
    }

    // Por si el email no llegó o venció
    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<Map<String, String>> reenviar(@RequestBody Map<String, String> body) {
        authService.reenviarVerificacion(body.get("email"));
        return ResponseEntity.ok(Map.of("mensaje", "Email de verificación reenviado"));
    }

    /*
     * Solicitar email de recuperación de contraseña.
     * Por seguridad siempre responde 200 OK aunque el email no exista — no
     * queremos filtrar qué emails están registrados.
     */
    @PostMapping("/olvide-password")
    public ResponseEntity<Map<String, String>> olvidePassword(@RequestBody Map<String, String> body) {
        authService.solicitarResetPassword(body.get("email"));
        return ResponseEntity.ok(Map.of(
            "mensaje", "Si ese email existe, te enviamos un link para resetear la contraseña."
        ));
    }

    /*
     * Resetear contraseña con el token del email.
     * Body: { "token": "...", "password": "nuevaPass" }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetearPassword(body.get("token"), body.get("password"));
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada"));
    }
}