package com.nsobrero.blogArtesanos.config;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/*
 * Se ejecuta al arrancar Spring Boot.
 * Garantiza que SIEMPRE haya un usuario admin con el email configurado en
 * app.admin-email. Si no existe lo crea con app.admin-password y queda
 * verificado y como PREMIUM vitalicio (sin fecha de expiración).
 *
 * Si ya existe (por ejemplo, alguien se registró con ese email), simplemente
 * le actualiza el rol a ADMIN y lo marca como verificado.
 *
 * Esto es más seguro que comparar emails en cada endpoint:
 *  - El rol vive en la base
 *  - Se puede tener varios admins en el futuro sin tocar properties
 *  - Si te roban el JWT de un USER, no pueden upgrade a Premium
 */
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements CommandLineRunner {

    private final ArtesanoRepository artesanoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-email}")
    private String adminEmail;

    @Value("${app.admin-password}")
    private String adminPassword;

    @Value("${app.admin-nombre:Admin}")
    private String adminNombre;

    @Override
    public void run(String... args) {
        artesanoRepository.findByEmail(adminEmail).ifPresentOrElse(
            // Caso 1: ya existe → garantizar rol ADMIN, verificado y premium vitalicio
            existente -> {
                boolean cambios = false;
                if (existente.getRol() != RolUsuario.ADMIN) {
                    existente.setRol(RolUsuario.ADMIN);
                    cambios = true;
                }
                if (!Boolean.TRUE.equals(existente.getVerificado())) {
                    existente.setVerificado(true);
                    existente.setTokenVerificacion(null);
                    existente.setTokenExpiracion(null);
                    cambios = true;
                }
                if (existente.getPlan() != PlanArtesano.PREMIUM) {
                    existente.setPlan(PlanArtesano.PREMIUM);
                    existente.setFechaExpiracionPlan(null); // null = vitalicio
                    cambios = true;
                }
                if (cambios) {
                    artesanoRepository.save(existente);
                    org.slf4j.LoggerFactory.getLogger(AdminBootstrap.class).info("Admin actualizado: {}", adminEmail);
                } else {
                    org.slf4j.LoggerFactory.getLogger(AdminBootstrap.class).info("Admin ya configurado: {}", adminEmail);
                }
            },
            // Caso 2: no existe → crear desde cero
            () -> {
                Artesano admin = new Artesano();
                admin.setNombre(adminNombre);
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setSlug(generarSlugAdmin());
                admin.setVerificado(true);
                admin.setRol(RolUsuario.ADMIN);
                admin.setPlan(PlanArtesano.PREMIUM);
                admin.setFechaExpiracionPlan(null); // vitalicio
                artesanoRepository.save(admin);
                org.slf4j.LoggerFactory.getLogger(AdminBootstrap.class).info("Admin creado: {}", adminEmail);
            }
        );
    }

    /*
     * Slug único para el admin. Si por alguna razón "admin" ya está tomado
     * (por ejemplo en una migración), agregamos un sufijo numérico.
     */
    private String generarSlugAdmin() {
        String base = "admin";
        if (!artesanoRepository.existsBySlug(base)) return base;
        return base + "-" + System.currentTimeMillis();
    }
}
