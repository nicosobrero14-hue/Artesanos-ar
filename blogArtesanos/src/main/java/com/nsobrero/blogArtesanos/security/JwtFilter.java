package com.nsobrero.blogArtesanos.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.service.JwtService;

import java.io.IOException;

/*
 * Este filtro se ejecuta UNA VEZ por cada request HTTP que llega al servidor.
 * Su trabajo es leer el token JWT del header "Authorization",
 * validarlo, y si es válido, decirle a Spring Security quién es el usuario.
 *
 * Sin este filtro, Spring Security no sabe quién está haciendo el pedido.
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ArtesanoRepository artesanoRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // El token viene en el header: Authorization: Bearer eyJhbGc...
        String authHeader = request.getHeader("Authorization");

        // Si no hay header o no empieza con "Bearer ", dejamos pasar el request
        // sin autenticar (accederá solo a rutas públicas)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraemos el token quitando el prefijo "Bearer "
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        // Si hay email en el token y el usuario no está autenticado todavía
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Buscamos el artesano en la base de datos
            var artesano = artesanoRepository.findByEmail(email).orElse(null);

            // Si existe y el token es válido, lo autenticamos
            if (artesano != null && jwtService.isTokenValid(token, artesano)) {
                var authToken = new UsernamePasswordAuthenticationToken(
                        artesano, null, artesano.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Guardamos la autenticación en el contexto de seguridad
                // Ahora Spring Security sabe quién es el usuario para este request
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
