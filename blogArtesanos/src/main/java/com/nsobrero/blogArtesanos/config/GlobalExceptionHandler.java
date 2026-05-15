package com.nsobrero.blogArtesanos.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/*
 * @RestControllerAdvice intercepta todas las excepciones que lanzan
 * los controllers y las convierte en respuestas JSON consistentes.
 *
 * Usamos SLF4J (logger) en vez de System.err / printStackTrace porque:
 *  - Se respeta el formato/nivel de logging configurado
 *  - En prod va a archivo o servicio (Sentry, Datadog), no a stdout
 *  - No expone stack trace al cliente
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        // No logueamos credenciales — solo el evento genérico
        log.warn("Credenciales inválidas en login");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email o contraseña incorrectos"));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Cuenta deshabilitada"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Error de validación");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", mensaje));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        // Logger en vez de printStackTrace. El stack trace va al log file/servicio,
        // no al stdout. Al cliente solo le mandamos un mensaje genérico — nada de
        // exponer la clase de excepción ni paths del código.
        log.error("Error procesando request", ex);
        String mensaje = ex.getMessage() != null
                ? ex.getMessage()
                : "Ocurrió un error procesando la solicitud";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", mensaje));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        String mensaje = ex.getMessage() != null
                ? ex.getMessage()
                : "Argumento inválido";
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", mensaje));
    }
}
