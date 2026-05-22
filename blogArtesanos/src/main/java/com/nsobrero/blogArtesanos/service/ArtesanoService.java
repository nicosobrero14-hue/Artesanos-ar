package com.nsobrero.blogArtesanos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.nsobrero.blogArtesanos.dto.ActualizarPerfilRequest;
import com.nsobrero.blogArtesanos.dto.ArtesanoPublicoDTO;
import com.nsobrero.blogArtesanos.dto.EstadisticasDTO;
import com.nsobrero.blogArtesanos.dto.PlanInfoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.enums.EstadoPedido;
import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ContactoRepository;
import com.nsobrero.blogArtesanos.repository.PedidoRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtesanoService {

    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;
    private final PedidoRepository pedidoRepository;
    private final ContactoRepository contactoRepository;
    private final PlanService planService;

    /*
     * Catálogo público: artesanos activos.
     * Excluimos cuentas ADMIN — son operativas, no tienen taller que mostrar.
     * Ordenamos premium primero (beneficio pago), luego alfabético.
     */
    public List<ArtesanoPublicoDTO> listarActivos() {
        return artesanoRepository.findAll().stream()
                .filter(Artesano::getActivo)
                .filter(a -> a.getRol() != RolUsuario.ADMIN)
                .sorted(java.util.Comparator
                        .<Artesano, Boolean>comparing(planService::isPremium).reversed()
                        .thenComparing(a -> a.getNombre() == null ? "" : a.getNombre().toLowerCase()))
                .map(this::toPublicoDTO)
                .toList();
    }

    /*
     * Perfil público por slug. Si el slug corresponde a un ADMIN, fingimos
     * que no existe — así el admin no es navegable desde el público.
     *
     * visitanteId: id del usuario logueado que mira el perfil (o null si es
     * un visitante anónimo). Si el visitante es el propio dueño, NO contamos
     * la visita — sería inflar la métrica con uno mismo.
     */
    @org.springframework.transaction.annotation.Transactional
    public ArtesanoPublicoDTO obtenerPorSlug(String slug, Long visitanteId, boolean contarVisita) {
        Artesano artesano = artesanoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado: " + slug));
        if (artesano.getRol() == RolUsuario.ADMIN) {
            throw new RuntimeException("Artesano no encontrado: " + slug);
        }

        // Contar visita solo si corresponde y no es el propio dueño quien mira.
        // contarVisita=false lo usa el scrapeo de Open Graph (bots) para no inflar.
        if (contarVisita && (visitanteId == null || !visitanteId.equals(artesano.getId()))) {
            Long actuales = artesano.getVisitasPerfil() != null ? artesano.getVisitasPerfil() : 0L;
            artesano.setVisitasPerfil(actuales + 1);
            artesanoRepository.save(artesano);
        }

        return toPublicoDTO(artesano);
    }

    public ArtesanoPublicoDTO obtenerPorSlug(String slug, Long visitanteId) {
        return obtenerPorSlug(slug, visitanteId, true);
    }

    // Sobrecarga para visitante anónimo
    public ArtesanoPublicoDTO obtenerPorSlug(String slug) {
        return obtenerPorSlug(slug, null, true);
    }

    // Estadísticas del panel privado
    public EstadisticasDTO obtenerEstadisticas(Long artesanoId) {
        var piezas = piezaRepository.findByArtesanoId(artesanoId);
        var pedidos = pedidoRepository.findByArtesanoId(artesanoId);
        var mensajes = contactoRepository.findByArtesanoIdAndLeidoFalse(artesanoId);

        Artesano artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));
        long visitasPerfil = artesano.getVisitasPerfil() != null ? artesano.getVisitasPerfil() : 0L;

        long disponibles = piezas.stream()
                .filter(p -> p.getEstado() == EstadoPieza.DISPONIBLE).count();

        long vendidas = piezas.stream()
                .filter(p -> p.getEstado() == EstadoPieza.VENDIDA).count();

        long pedidosAbiertos = pedidos.stream()
                .filter(p -> p.getEstado() != EstadoPedido.ENTREGADO
                          && p.getEstado() != EstadoPedido.CANCELADO).count();

        long pedidosListos = pedidos.stream()
                .filter(p -> p.getEstado() == EstadoPedido.LISTO).count();

        // Total de horas trabajadas en todas las piezas
        int totalHoras = piezas.stream()
                .filter(p -> p.getHorasTrabajo() != null)
                .mapToInt(p -> p.getHorasTrabajo())
                .sum();

        // Total facturado: suma de precios de piezas vendidas
        BigDecimal totalFacturado = piezas.stream()
                .filter(p -> p.getEstado() == EstadoPieza.VENDIDA)
                .map(p -> p.getPrecio())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Valor hora promedio = total facturado / horas trabajadas
        BigDecimal valorHora = BigDecimal.ZERO;
        if (totalHoras > 0) {
            valorHora = totalFacturado.divide(
                    BigDecimal.valueOf(totalHoras), 2, RoundingMode.HALF_UP
            );
        }

        return new EstadisticasDTO(
                piezas.size(), disponibles, vendidas,
                pedidosAbiertos, pedidosListos,
                totalHoras, totalFacturado, valorHora,
                mensajes.size(),
                visitasPerfil
        );
    }

    // Convierte la entidad Artesano al DTO público (sin datos sensibles)
    private ArtesanoPublicoDTO toPublicoDTO(Artesano a) {
        return new ArtesanoPublicoDTO(
                a.getId(), a.getNombre(), a.getSlug(),
                a.getBio(), a.getAvatarUrl(), a.getUbicacion(),
                a.getRubros(), a.getInstagram(), a.getWhatsapp(),
                planService.isPremium(a)
        );
    }
    
    
    /*
     * Devuelve la info del plan del artesano logueado:
     * cuál tiene, cuántas piezas usó, cuántas fotos puede subir, etc.
     * Lo usa el frontend para mostrar "X/10 piezas" y bloquear botones.
     */
    public PlanInfoDTO obtenerPlanInfo(Long artesanoId) {
        Artesano artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        long piezasActuales = piezaRepository.countByArtesanoId(artesanoId);
        boolean premium = planService.isPremium(artesano);
        int maxPiezas = planService.maxPiezas(artesano);

        // Defensive: si el plan vino null en la DB (legacy rows), tratar como GRATIS
        PlanArtesano plan = artesano.getPlan() != null ? artesano.getPlan() : PlanArtesano.GRATIS;

        return new PlanInfoDTO(
            plan.name(),
            premium,
            artesano.getFechaExpiracionPlan(),
            maxPiezas == Integer.MAX_VALUE ? null : maxPiezas,
            planService.maxFotosPorPieza(artesano),
            planService.puedeDestacar(artesano),
            piezasActuales
        );
    }

    public void actualizarPerfil(Long artesanoId, ActualizarPerfilRequest request) {
        Artesano artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        // Si cambia el nombre, validar regla de 30 días entre cambios
        if (request.nombre() != null && !request.nombre().equals(artesano.getNombre())) {
            var ultimoCambio = artesano.getUltimoCambioNombre();
            if (ultimoCambio != null) {
                long diasDesdeCambio = java.time.temporal.ChronoUnit.DAYS.between(
                    ultimoCambio, java.time.LocalDate.now()
                );
                if (diasDesdeCambio < 30) {
                    long diasFaltantes = 30 - diasDesdeCambio;
                    throw new RuntimeException(
                        "Solo podés cambiar el nombre cada 30 días. " +
                        "Faltan " + diasFaltantes + " días para tu próximo cambio."
                    );
                }
            }
            artesano.setNombre(request.nombre());
            artesano.setUltimoCambioNombre(java.time.LocalDate.now());
        }

        artesano.setBio(request.bio());
        artesano.setUbicacion(request.ubicacion());
        artesano.setRubros(request.rubros());
        artesano.setInstagram(request.instagram());
        artesano.setWhatsapp(request.whatsapp());
        artesanoRepository.save(artesano);
    }
}
