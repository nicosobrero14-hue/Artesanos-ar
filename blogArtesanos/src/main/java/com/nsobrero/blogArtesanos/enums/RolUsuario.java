package com.nsobrero.blogArtesanos.enums;

/*
 * Rol del usuario dentro del sistema.
 *
 * USER: artesano normal — solo puede gestionar sus propias piezas, clientes, etc.
 * ADMIN: superusuario — puede activar/desactivar premium a cualquiera, ver todos los artesanos.
 *
 * El admin se asigna automáticamente al usuario que coincide con el email
 * configurado en application.properties (app.admin-email).
 */
public enum RolUsuario {
    USER,
    ADMIN
}
