package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/*
 * Genera dinámicamente el sitemap.xml para que Google indexe el sitio.
 * Incluye:
 *  - Home (/)
 *  - /eventos, /ranking, /premium (estáticas)
 *  - Cada artesano público (/artesano/{slug})
 *  - Cada pieza pública (/artesano/{slug}/pieza/{id})
 *
 * Excluye admins, cuentas inactivas, y todo lo que está atrás de auth.
 *
 * Servido en /sitemap.xml directamente (no /api) para que sea descubrible
 * desde robots.txt sin path raros.
 */
@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Páginas estáticas
        addUrl(sb, "/", "1.0", "daily");
        addUrl(sb, "/eventos", "0.8", "daily");
        addUrl(sb, "/ranking", "0.6", "weekly");
        addUrl(sb, "/premium", "0.5", "monthly");

        // Artesanos públicos (no admins, activos)
        for (Artesano a : artesanoRepository.findAll()) {
            if (Boolean.TRUE.equals(a.getActivo()) && a.getRol() != RolUsuario.ADMIN) {
                addUrl(sb, "/artesano/" + a.getSlug(), "0.7", "weekly");
            }
        }

        // Piezas públicas
        for (Pieza p : piezaRepository.findTodasPublicas()) {
            addUrl(sb, "/artesano/" + p.getArtesano().getSlug() + "/pieza/" + p.getId(),
                   "0.6", "weekly");
        }

        sb.append("</urlset>\n");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(sb.toString());
    }

    private void addUrl(StringBuilder sb, String path, String priority, String changefreq) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(frontendUrl).append(path).append("</loc>\n");
        sb.append("    <lastmod>").append(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)).append("</lastmod>\n");
        sb.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
    }
}
