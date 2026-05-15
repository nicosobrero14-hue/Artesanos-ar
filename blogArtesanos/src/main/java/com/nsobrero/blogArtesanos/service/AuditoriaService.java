package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.LogAuditoria;
import com.nsobrero.blogArtesanos.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/*
 * Helper para loggear acciones admin.
 * Best-effort: si falla guardar el log, la operación principal no se rompe.
 */
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final LogAuditoriaRepository repo;

    public void log(Artesano admin, String accion, String objetoTipo, Long objetoId, String detalle) {
        try {
            LogAuditoria l = new LogAuditoria();
            l.setAdminId(admin.getId());
            l.setAdminNombre(admin.getNombre());
            l.setAccion(accion);
            l.setObjetoTipo(objetoTipo);
            l.setObjetoId(objetoId);
            l.setDetalle(detalle);
            repo.save(l);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuditoriaService.class)
                .warn("Error al loggear auditoría", e);
        }
    }
}
