package com.nsobrero.blogArtesanos.controller;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.nsobrero.blogArtesanos.dto.PiezaDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.imagen.CloudinaryService;
import com.nsobrero.blogArtesanos.service.PiezaService;

@RestController
@RequestMapping("/api/mis-piezas")
@RequiredArgsConstructor
public class ImagenController {

    private final CloudinaryService cloudinaryService;
    private final PiezaService piezaService;
   

    /*
     * POST /api/mis-piezas/{id}/fotos
     * Recibe la imagen, la sube a Cloudinary, y guarda la URL en la pieza.
     *
     * @RequestParam("foto") indica que el archivo viene en el campo "foto"
     * del multipart form (no en el body JSON).
     */
    @PostMapping("/{id}/fotos")
    public ResponseEntity<PiezaDTO> subirFoto(
            @PathVariable Long id,
            @RequestParam("foto") MultipartFile foto,
            @AuthenticationPrincipal Artesano artesano) {

        String url = cloudinaryService.subirImagen(foto, "artesanos/" + artesano.getSlug());
        return ResponseEntity.ok(piezaService.agregarFoto(id, url, artesano.getId()));
    }
    
    @DeleteMapping("/{id}/fotos/{indice}")
    public ResponseEntity<PiezaDTO> eliminarFoto(
            @PathVariable Long id,
            @PathVariable int indice,
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(piezaService.eliminarFoto(id, indice, artesano.getId()));
    }

    /*
     * POST /api/mis-piezas/{id}/video — sube un video a la pieza (premium-only).
     * Cloudinary trunca a 30s automáticamente vía eager transformation.
     */
    @PostMapping("/{id}/video")
    public ResponseEntity<PiezaDTO> subirVideo(
            @PathVariable Long id,
            @RequestParam("video") MultipartFile video,
            @AuthenticationPrincipal Artesano artesano) {

        String url = cloudinaryService.subirVideo(video, "artesanos/" + artesano.getSlug() + "/videos");
        return ResponseEntity.ok(piezaService.setVideo(id, url, artesano.getId()));
    }

    @DeleteMapping("/{id}/video")
    public ResponseEntity<PiezaDTO> eliminarVideo(
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(piezaService.eliminarVideo(id, artesano.getId()));
    }
}
