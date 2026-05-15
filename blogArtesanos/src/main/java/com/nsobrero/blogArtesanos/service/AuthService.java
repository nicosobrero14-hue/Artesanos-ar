package com.nsobrero.blogArtesanos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nsobrero.blogArtesanos.auth.AuthResponse;
import com.nsobrero.blogArtesanos.auth.LoginRequest;
import com.nsobrero.blogArtesanos.auth.RegisterRequest;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ArtesanoRepository artesanoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public void register(RegisterRequest request) {
        if (artesanoRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");
        }

        String slug = request.slug() != null
                ? request.slug()
                : generarSlug(request.nombre());

        if (artesanoRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        /*
         * UUID genera un token único aleatorio.
         * Lo guardamos en la BD junto con la fecha de expiración (24 horas).
         * La cuenta arranca con verificado = false — no puede loguearse hasta verificar.
         */
        String token = UUID.randomUUID().toString();

        Artesano artesano = new Artesano();
        artesano.setNombre(request.nombre());
        artesano.setEmail(request.email());
        artesano.setPassword(passwordEncoder.encode(request.password()));
        artesano.setSlug(slug);
        artesano.setUbicacion(request.ubicacion());
        artesano.setVerificado(false);
        artesano.setTokenVerificacion(token);
        artesano.setTokenExpiracion(LocalDateTime.now().plusHours(24));

        artesanoRepository.save(artesano);

        // Mandamos el email — si falla, el registro igual se guarda
        // El artesano puede pedir reenvío después
        try {
            emailService.enviarVerificacion(artesano.getEmail(), artesano.getNombre(), token);
        } catch (Exception e) {
            // Log del error pero no rompemos el registro
            org.slf4j.LoggerFactory.getLogger(AuthService.class)
                .warn("Error al enviar email de verificación", e);
        }
    }

    public AuthResponse login(LoginRequest request) {
        /*
         * authenticate() valida credenciales Y dispara DisabledException si la cuenta
         * tiene activo=false (porque Artesano.isEnabled() devuelve activo).
         * Catcheamos ese caso y mostramos el motivo de suspensión guardado.
         */
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (org.springframework.security.authentication.DisabledException ex) {
            // Buscamos el motivo para el mensaje
            Artesano susp = artesanoRepository.findByEmail(request.email()).orElse(null);
            String motivo = susp != null && susp.getMotivoSuspension() != null
                    ? susp.getMotivoSuspension()
                    : "Tu cuenta fue suspendida";
            throw new IllegalStateException(
                "Cuenta suspendida: " + motivo +
                ". Si creés que es un error, contactanos por feedback."
            );
        }

        Artesano artesano = artesanoRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        /*
         * Si la cuenta no está verificada, bloqueamos el login.
         * Lanzamos una excepción con un mensaje claro para mostrar en el frontend.
         */
        if (!artesano.getVerificado()) {
            throw new IllegalStateException("Cuenta no verificada. Revisá tu email para activarla.");
        }

        String token = jwtService.generateToken(artesano);
        String rol = artesano.getRol() != null ? artesano.getRol().name() : "USER";
        return new AuthResponse(
            artesano.getId(), token,
            artesano.getNombre(), artesano.getEmail(),
            artesano.getSlug(), rol
        );
    }

    public void verificarCuenta(String token) {
        Artesano artesano = artesanoRepository.findByTokenVerificacion(token)
                .orElseThrow(() -> new RuntimeException("Token inválido o ya utilizado"));

        if (artesano.getTokenExpiracion().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El token de verificación venció. Solicitá uno nuevo.");
        }

        artesano.setVerificado(true);
        artesano.setTokenVerificacion(null);   // limpiamos el token — ya no sirve
        artesano.setTokenExpiracion(null);
        artesanoRepository.save(artesano);
    }

    /*
     * Solicitar recuperación de contraseña.
     * Por seguridad, NO indicamos si el email existe o no — siempre responde igual.
     * Si existe, manda email con token. Si no existe, no hace nada (silenciosamente).
     */
    public void solicitarResetPassword(String email) {
        artesanoRepository.findByEmail(email).ifPresent(artesano -> {
            String token = UUID.randomUUID().toString();
            artesano.setTokenResetPassword(token);
            artesano.setTokenResetExpiracion(LocalDateTime.now().plusHours(1));
            artesanoRepository.save(artesano);
            try {
                emailService.enviarResetPassword(artesano.getEmail(), artesano.getNombre(), token);
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(AuthService.class)
                    .warn("Error al enviar email de reset password", e);
            }
        });
    }

    /*
     * Resetear contraseña con el token recibido en el email.
     * Vence después de 1 hora. Apenas se usa, se invalida (un único uso).
     */
    public void resetearPassword(String token, String nuevaPassword) {
        Artesano artesano = artesanoRepository.findByTokenResetPassword(token)
                .orElseThrow(() -> new RuntimeException("Token inválido o ya utilizado"));

        if (artesano.getTokenResetExpiracion() == null
                || artesano.getTokenResetExpiracion().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El link venció. Pedí uno nuevo desde 'Olvidé mi contraseña'.");
        }

        if (nuevaPassword == null || nuevaPassword.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }

        artesano.setPassword(passwordEncoder.encode(nuevaPassword));
        artesano.setTokenResetPassword(null);
        artesano.setTokenResetExpiracion(null);
        artesanoRepository.save(artesano);
    }

    public void reenviarVerificacion(String email) {
        Artesano artesano = artesanoRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No existe una cuenta con ese email"));

        if (artesano.getVerificado()) {
            throw new IllegalStateException("La cuenta ya está verificada");
        }

        String nuevoToken = UUID.randomUUID().toString();
        artesano.setTokenVerificacion(nuevoToken);
        artesano.setTokenExpiracion(LocalDateTime.now().plusHours(24));
        artesanoRepository.save(artesano);

        emailService.enviarVerificacion(artesano.getEmail(), artesano.getNombre(), nuevoToken);
    }

    private String generarSlug(String nombre) {
        return nombre.toLowerCase()
                .replace(" ", "-")
                .replaceAll("[áàä]", "a")
                .replaceAll("[éèë]", "e")
                .replaceAll("[íìï]", "i")
                .replaceAll("[óòö]", "o")
                .replaceAll("[úùü]", "u")
                .replaceAll("[^a-z0-9-]", "");
    }
}