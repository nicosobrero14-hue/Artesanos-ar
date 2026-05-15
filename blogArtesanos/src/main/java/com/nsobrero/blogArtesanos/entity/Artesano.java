package com.nsobrero.blogArtesanos.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import com.nsobrero.blogArtesanos.enums.RolUsuario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "artesanos")
@Getter
@Setter
@NoArgsConstructor
public class Artesano implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nombre;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    /*
     * El slug es la URL pública del artesano.
     * Por ejemplo: /artesano/nico-sobrero
     * unique = true garantiza que no puede haber dos artesanos con el mismo slug.
     */
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String avatarUrl;
    private String ubicacion;
    private String rubros;
    private String instagram;
    private String whatsapp;
    
    // true = cuenta verificada, false = pendiente de verificación
    @Column(nullable = false)
    private Boolean verificado = false;

    // Token único que se manda por email
    private String tokenVerificacion;

    // Cuándo vence el token (24 horas)
    private LocalDateTime tokenExpiracion;

    // Token y vencimiento para recuperar contraseña ("olvidé mi contraseña")
    // Se invalida apenas se usa una vez.
    private String tokenResetPassword;
    private LocalDateTime tokenResetExpiracion;

    @Column(nullable = false)
    private LocalDate fechaRegistro = LocalDate.now();

    @Column(nullable = false)
    private Boolean activo = true;

    /*
     * Si el admin suspende la cuenta (activo=false), opcionalmente guarda
     * el motivo. Se muestra en el login para que el usuario sepa por qué
     * no puede entrar.
     */
    @Column(length = 500)
    private String motivoSuspension;

    /*
     * Tracking del último cambio de nombre. El artesano solo puede cambiar
     * su nombre/taller una vez cada 30 días. Esto evita abuso (cambiar nombre
     * para escapar de reseñas malas, suplantar identidad, etc.).
     */
    private LocalDate ultimoCambioNombre;

    /*
     * Plan de la cuenta. Por defecto arranca GRATIS.
     * Cuando el artesano paga, el admin lo cambia a PREMIUM y setea fechaExpiracionPlan.
     * Si fechaExpiracionPlan venció, isPremium() devuelve false aunque plan == PREMIUM.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlanArtesano plan = PlanArtesano.GRATIS;

    private LocalDate fechaExpiracionPlan;

    /*
     * Rol dentro del sistema. Por defecto USER.
     * El bootstrap al arrancar la app marca como ADMIN al usuario
     * cuyo email coincide con app.admin-email.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolUsuario rol = RolUsuario.USER;

    /*
     * @OneToMany: un artesano tiene muchas piezas.
     * mappedBy = "artesano" le dice a JPA que la relación está definida
     * en el campo "artesano" dentro de la clase Pieza.
     * cascade = ALL: si borrás un artesano, se borran sus piezas también.
     * orphanRemoval = true: si sacás una pieza de la lista, se borra de la BD.
     *
     * IMPORTANTE: List<Pieza>, List<Cliente>, List<Pedido> con tipo genérico.
     * Hibernate 6 (Spring Boot 3.x) exige los tipos genéricos — sin ellos no arranca.
     */
    @OneToMany(mappedBy = "artesano", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pieza> piezas = new ArrayList<>();

    @OneToMany(mappedBy = "artesano", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cliente> clientes = new ArrayList<>();

    @OneToMany(mappedBy = "artesano", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pedido> pedidos = new ArrayList<>();

    // ── Métodos requeridos por UserDetails ─────────────────────────────────
    // Spring Security llama a estos métodos internamente.
    // Como no usamos roles complejos, devolvemos una lista vacía.
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    // Spring Security usa getUsername() para identificar al usuario.
    // Nosotros identificamos por email, entonces retornamos el email.
    @Override
    public String getUsername() {
        return email;
    }

    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return activo; }
}