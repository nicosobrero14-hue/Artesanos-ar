package com.nsobrero.blogArtesanos.service;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/*
 * Sanitización básica de inputs de texto para prevenir XSS y abusos.
 *
 * Estrategia: NO permitimos HTML en absoluto en los textos del usuario.
 * Removemos tags HTML + scripts + atributos peligrosos. El frontend ya escapea
 * por defecto al renderizar con React, pero defense-in-depth nunca está de más.
 *
 * Si en el futuro queremos permitir markdown limitado (bold, italic, links),
 * conviene agregar Jsoup como dependencia y usar un whitelist policy.
 */
@Service
public class SanitizerService {

    // Tags HTML, atributos on*, javascript:, data:, vbscript: — patrones peligrosos
    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]+>");
    private static final Pattern SCRIPT_TAGS = Pattern.compile(
        "(?i)<script[^>]*>.*?</script>", Pattern.DOTALL
    );
    private static final Pattern JS_PROTOCOL = Pattern.compile(
        "(?i)(javascript|vbscript|data):\\s*", Pattern.CASE_INSENSITIVE
    );

    /*
     * Limpia un texto plano. Devuelve null si el input es null para no
     * cambiar el tipo (algunos campos opcionales).
     */
    public String limpiar(String texto) {
        if (texto == null) return null;
        String t = texto.trim();

        // Sacar scripts primero (más agresivo)
        t = SCRIPT_TAGS.matcher(t).replaceAll("");
        // Sacar cualquier otro tag HTML
        t = HTML_TAGS.matcher(t).replaceAll("");
        // Sacar protocolos peligrosos
        t = JS_PROTOCOL.matcher(t).replaceAll("");
        // Normalizar whitespace excesivo (más de 2 saltos de línea consecutivos)
        t = t.replaceAll("\\n{3,}", "\n\n");

        return t;
    }

    /*
     * Mismo sanitizado pero con límite de longitud, útil para campos donde
     * queremos cortar exceso (ej. mensaje de contacto 500 chars).
     */
    public String limpiar(String texto, int maxLength) {
        String t = limpiar(texto);
        if (t == null) return null;
        return t.length() > maxLength ? t.substring(0, maxLength) : t;
    }
}
