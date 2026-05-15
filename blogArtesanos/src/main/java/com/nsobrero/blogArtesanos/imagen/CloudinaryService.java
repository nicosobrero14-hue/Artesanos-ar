package com.nsobrero.blogArtesanos.imagen;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/*
 * Este servicio se encarga de subir imágenes a Cloudinary.
 * El flujo es:
 * 1. El artesano selecciona una foto en el frontend
 * 2. React manda la imagen al backend con multipart/form-data
 * 3. Este servicio la sube a Cloudinary
 * 4. Cloudinary devuelve una URL pública
 * 5. Guardamos esa URL en la base de datos
 *
 * Ventaja: las imágenes están en la nube, no en tu servidor.
 * Si reiniciás el servidor, las fotos no se pierden.
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    // El constructor lee las credenciales de application.properties
    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    /*
     * Sube una imagen y devuelve la URL pública.
     * MultipartFile es el tipo que usa Spring para archivos subidos por el cliente.
     * folder: carpeta en Cloudinary donde se guardará la imagen.
     */
    public String subirImagen(MultipartFile archivo, String folder) {
        try {
            Map resultado = cloudinary.uploader().upload(
                    archivo.getBytes(),
                    ObjectUtils.asMap("folder", folder)
            );
            // "secure_url" es la URL HTTPS de la imagen
            return (String) resultado.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Error al subir la imagen: " + e.getMessage());
        }
    }

    /*
     * Sube un video a Cloudinary.
     *  - resource_type=video: para que Cloudinary lo procese como video.
     *  - end_offset=30: trunca el video a 30 segundos. Si dura menos no afecta.
     *  - fetch_format=mp4 + quality=auto: comprime para que se reproduzca rápido.
     *
     * Devuelve la URL HTTPS del video procesado.
     */
    public String subirVideo(MultipartFile archivo, String folder) {
        try {
        	Map resultado = cloudinary.uploader().upload(
        	        archivo.getBytes(),
        	        ObjectUtils.asMap(
        	                "folder", folder,
        	                "resource_type", "video"
        	        )
        	);

            return (String) resultado.get("secure_url");

        } catch (IOException e) {
            throw new RuntimeException("Error al subir el video: " + e.getMessage());
        }
    }

    /*
     * Borra un asset (imagen o video) de Cloudinary usando la URL.
     * Es best-effort: si falla, igual seguimos (la app no se rompe).
     */
    public void borrarPorUrl(String url, String resourceType) {
        if (url == null || url.isBlank()) return;
        try {
            // Extraemos el public_id de la URL: .../folder/file_name.ext
            int slashAfterUpload = url.indexOf("/upload/");
            if (slashAfterUpload < 0) return;
            String afterUpload = url.substring(slashAfterUpload + "/upload/".length());
            // Quitamos eventual versión v1234/
            if (afterUpload.startsWith("v")) {
                int firstSlash = afterUpload.indexOf('/');
                if (firstSlash > 0) afterUpload = afterUpload.substring(firstSlash + 1);
            }
            // Quitamos extensión
            int lastDot = afterUpload.lastIndexOf('.');
            String publicId = lastDot > 0 ? afterUpload.substring(0, lastDot) : afterUpload;

            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(CloudinaryService.class)
                .warn("Error al borrar de Cloudinary", e);
        }
    }
}