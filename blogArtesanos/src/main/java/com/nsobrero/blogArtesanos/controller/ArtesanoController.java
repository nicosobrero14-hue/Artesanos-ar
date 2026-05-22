package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.auth.ContactoRequest;
import com.nsobrero.blogArtesanos.dto.ActualizarPerfilRequest;
import com.nsobrero.blogArtesanos.dto.ArtesanoPublicoDTO;
import com.nsobrero.blogArtesanos.dto.EstadisticasDTO;
import com.nsobrero.blogArtesanos.dto.PlanInfoDTO;
import com.nsobrero.blogArtesanos.dto.StatsAvanzadasDTO;
import com.nsobrero.blogArtesanos.service.StatsAvanzadasService;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.imagen.CloudinaryService;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.service.ArtesanoService;
import com.nsobrero.blogArtesanos.service.ContactoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artesanos")
@RequiredArgsConstructor
public class ArtesanoController {

    private final ArtesanoService artesanoService;
    private final ContactoService contactoService;
    private final ArtesanoRepository artesanoRepository;
    private final CloudinaryService cloudinaryService;
    private final StatsAvanzadasService statsAvanzadasService;

    // ── Catálogo público ───────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<ArtesanoPublicoDTO>> listar() {
        return ResponseEntity.ok(artesanoService.listarActivos());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ArtesanoPublicoDTO> obtener(
            @PathVariable String slug,
            @RequestParam(name = "og", required = false, defaultValue = "false") boolean og,
            @AuthenticationPrincipal Artesano usuario) {
        Long visitanteId = usuario != null ? usuario.getId() : null;
        // og=true → es el scrapeo de Open Graph (un bot), no cuenta como visita
        return ResponseEntity.ok(artesanoService.obtenerPorSlug(slug, visitanteId, !og));
    }

    @PostMapping("/{slug}/contacto")
    public ResponseEntity<Void> contactar(@PathVariable String slug,
                                          @Valid @RequestBody ContactoRequest request) {
        contactoService.enviar(slug, request);
        return ResponseEntity.noContent().build();
    }

    // ── Panel privado ──────────────────────────────────────────────────────

    @GetMapping("/mi-panel/estadisticas")
    public ResponseEntity<EstadisticasDTO> estadisticas(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(artesanoService.obtenerEstadisticas(artesano.getId()));
    }

    @GetMapping("/mi-panel/plan")
    public ResponseEntity<PlanInfoDTO> planInfo(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(artesanoService.obtenerPlanInfo(artesano.getId()));
    }

    /*
     * Stats avanzadas — premium-only.
     * El service tira excepción si no es premium → 400 + mensaje claro.
     */
    @GetMapping("/mi-panel/stats-avanzadas")
    public ResponseEntity<StatsAvanzadasDTO> statsAvanzadas(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(statsAvanzadasService.obtener(artesano.getId()));
    }

    // Endpoints admin movidos a AdminController (/api/admin/...)

    @PutMapping("/mi-perfil")
    public ResponseEntity<Void> actualizarPerfil(@RequestBody ActualizarPerfilRequest request,
                                                  @AuthenticationPrincipal Artesano artesano) {
        artesanoService.actualizarPerfil(artesano.getId(), request);
        return ResponseEntity.noContent().build();
    }

    /*
     * Subida de avatar: recibe la imagen, la sube a Cloudinary
     * y guarda la URL en el artesano logueado.
     * Está acá (y no en ImagenController) para evitar conflicto de rutas
     * con los endpoints de piezas que también manejan imágenes.
     */
    @PostMapping("/mi-perfil/avatar")
    public ResponseEntity<Map<String, String>> subirAvatar(
            @RequestParam("foto") MultipartFile foto,
            @AuthenticationPrincipal Artesano artesano) {
        String url = cloudinaryService.subirImagen(foto, "artesanos/avatares");
        artesano.setAvatarUrl(url);
        artesanoRepository.save(artesano);
        return ResponseEntity.ok(Map.of("avatarUrl", url));
    }

    @DeleteMapping("/mi-perfil/avatar")
    public ResponseEntity<Void> eliminarAvatar(@AuthenticationPrincipal Artesano artesano) {
        artesano.setAvatarUrl(null);
        artesanoRepository.save(artesano);
        return ResponseEntity.noContent().build();
    }

    /*
     * DELETE /api/artesanos/mi-cuenta — eliminar cuenta propia (Ley 25.326).
     * Borra todo en cascada gracias a cascade=ALL en las relaciones de Artesano:
     * piezas, clientes, pedidos. Las reseñas que el usuario dejó a otros se
     * conservan (no se borran en cascada porque no están en Artesano.OneToMany).
     *
     * IMPORTANTE: el frontend debe pedir confirmación + password antes de llamar.
     * Por ahora el endpoint no requiere password — confiamos en el JWT.
     * Para más seguridad, en una v2 pedir password en el body y revalidar.
     */
    @DeleteMapping("/mi-cuenta")
    public ResponseEntity<Void> eliminarMiCuenta(@AuthenticationPrincipal Artesano artesano) {
        // Protección: no se puede eliminar a un admin desde acá
        if (artesano.getRol() == com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN) {
            throw new RuntimeException("No se puede eliminar la cuenta admin desde acá");
        }
        artesanoRepository.delete(artesano);
        return ResponseEntity.noContent().build();
    }
}