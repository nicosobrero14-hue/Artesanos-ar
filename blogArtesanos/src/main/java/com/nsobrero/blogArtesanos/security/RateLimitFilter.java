package com.nsobrero.blogArtesanos.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/*
 * Rate limiting básico por IP para endpoints sensibles.
 *
 *   - /api/auth/login              → 5 intentos / 5 minutos (anti fuerza-bruta)
 *   - /api/auth/register           → 3 cuentas / hora
 *   - /api/auth/olvide-password    → 3 / hora
 *   - /api/auth/reenviar-...       → 3 / hora
 *   - /api/feedback                → 5 / hora (anti spam)
 *
 * Almacenamiento in-memory con ConcurrentHashMap. Para multi-instancia (más de
 * 1 servidor) hay que migrar a Redis con bucket4j-redis. Para empezar esto alcanza.
 *
 * El bucket se identifica por IP+path. Si te cuelgan, esperás un rato y volvés.
 * El cliente recibe 429 Too Many Requests con un Retry-After header.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private record Limit(String pathPrefix, int capacity, Duration window) {}

    private static final Limit[] LIMITS = new Limit[] {
        new Limit("/api/auth/login",                  5, Duration.ofMinutes(5)),
        new Limit("/api/auth/register",               3, Duration.ofHours(1)),
        new Limit("/api/auth/olvide-password",        3, Duration.ofHours(1)),
        new Limit("/api/auth/reenviar-verificacion",  3, Duration.ofHours(1)),
        new Limit("/api/auth/reset-password",         5, Duration.ofHours(1)),
        new Limit("/api/feedback",                    5, Duration.ofHours(1))
    };

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        Limit hit = matchLimit(req);
        if (hit == null) {
            chain.doFilter(req, res);
            return;
        }

        String key = clientKey(req) + ":" + hit.pathPrefix;
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(hit.capacity, io.github.bucket4j.Refill.intervally(hit.capacity, hit.window)))
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfterSec = probe.getNanosToWaitForRefill() / 1_000_000_000L;
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(retryAfterSec));
            res.setContentType("application/json");
            res.getWriter().write(
                "{\"message\":\"Demasiados intentos. Esperá " + retryAfterSec + " segundos.\"}"
            );
            return;
        }
        chain.doFilter(req, res);
    }

    private Limit matchLimit(HttpServletRequest req) {
        // Solo aplicamos en POST. Los GET no necesitan limitación tan estricta.
        if (!"POST".equalsIgnoreCase(req.getMethod())) return null;
        String path = req.getRequestURI();
        for (Limit l : LIMITS) {
            if (path.startsWith(l.pathPrefix)) return l;
        }
        return null;
    }

    /*
     * Identificador del cliente. Usamos X-Forwarded-For si viene (detrás de proxy
     * como Nginx, Cloudflare). Si no, la IP directa.
     */
    private String clientKey(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
