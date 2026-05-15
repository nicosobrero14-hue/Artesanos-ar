package com.nsobrero.blogArtesanos.security;


import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final ArtesanoRepository artesanoRepository;

    @Value("${app.cors-origins}")
    private String corsOrigins;

    /*
     * Config CORS: solo los orígenes de app.cors-origins pueden hacer requests.
     * En prod: tu dominio real (https://artesanos.ar). Dev: localhost:5173.
     * Credentials=true permite que el browser mande/reciba cookies/headers de auth.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.asList(corsOrigins.split(",")));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    /*
     * UserDetailsService es la interfaz que Spring Security usa para buscar
     * un usuario por su username (en nuestro caso, el email).
     * Definimos el bean acá en vez de en AuthService para romper el ciclo
     * de dependencias que causaba el StackOverflow.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return email -> artesanoRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + email));
    }

    /*
     * DaoAuthenticationProvider es el proveedor estándar de Spring Security.
     * Le decimos cómo buscar usuarios (userDetailsService) y
     * cómo verificar contraseñas (passwordEncoder).
     * Spring Security usa esto cuando llamamos a authenticationManager.authenticate()
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            /*
             * Headers de seguridad estándar:
             *  - X-Frame-Options DENY: evita que tu sitio se cargue en un iframe (clickjacking)
             *  - X-Content-Type-Options nosniff: el browser respeta el Content-Type que mandamos
             *  - Referrer-Policy: no-referrer-when-downgrade — protege URLs internas
             *  - HSTS: forzar HTTPS por 1 año (solo aplica si servís sobre HTTPS)
             *  - Permissions-Policy: deshabilita features del browser que no usamos
             *
             * Spring Security 6 ya activa muchos por defecto, acá los reforzamos explícitos.
             */
            .headers(h -> h
                .frameOptions(f -> f.deny())
                .contentTypeOptions(c -> {})
                .referrerPolicy(r -> r.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER_WHEN_DOWNGRADE
                ))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                .permissionsPolicyHeader(p -> p.policy(
                    "camera=(), microphone=(), geolocation=(), payment=()"
                ))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/sitemap.xml").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/artesanos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/piezas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/piezas/*/comentarios").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/home/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/ranking/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/eventos/proximos").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/feedback").permitAll()
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}