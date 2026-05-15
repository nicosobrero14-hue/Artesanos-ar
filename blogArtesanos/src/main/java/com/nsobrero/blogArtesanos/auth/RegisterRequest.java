package com.nsobrero.blogArtesanos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/*
 * Record: es una clase especial de Java (desde Java 16) pensada para
 * datos inmutables. Genera automáticamente constructor, getters, equals,
 * hashCode y toString. Ideal para DTOs.
 *
 * Las validaciones (@NotBlank, @Email, @Size) se activan cuando el
 * controller tiene @Valid en el parámetro del método.
 */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @Email(message = "El email no es válido")
        @NotBlank(message = "El email es obligatorio")
        String email,

        @NotBlank
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String password,

        String slug,      // Opcional: si no viene, lo generamos del nombre
        String ubicacion
) {}
