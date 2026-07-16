package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Material;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.auth.PiezaRequest;
import com.nsobrero.blogArtesanos.dto.PiezaDTO;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.MaterialRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PiezaService {

    private final PiezaRepository piezaRepository;
    private final ArtesanoRepository artesanoRepository;
    private final MaterialRepository materialRepository;
    private final PlanService planService;
    private final MeGustaRepository meGustaRepository;
    private final ComentarioRepository comentarioRepository;
    private final com.nsobrero.blogArtesanos.repository.FavoritoRepository favoritoRepository;

    /*
     * Comparador para ordenar piezas: destacadas primero, luego por fecha de creación descendente.
     * Las premium pueden marcar destacadas, las gratis nunca, así que esto naturalmente
     * pone arriba a las piezas premium destacadas.
     */
    private static final Comparator<Pieza> ORDEN_DESTACADAS_PRIMERO =
        Comparator.<Pieza, Boolean>comparing(p -> Boolean.TRUE.equals(p.getDestacada()))
            .reversed()
            .thenComparing(Pieza::getFechaCreacion, Comparator.nullsLast(Comparator.reverseOrder()));

    /*
     * @Transactional garantiza que la sesión JPA esté abierta durante
     * toda la ejecución del método, incluyendo cuando se accede a las
     * colecciones lazy (materiales, fotos). Sin esto → LazyInitializationException.
     *
     * Usamos los métodos con JOIN FETCH para el catálogo público,
     * que es donde se accede a los materiales.
     */
    /*
     * Búsqueda global de piezas. Si la query es muy corta (<2 chars) devuelve vacío
     * para evitar matches absurdos en bases grandes.
     */
    @Transactional
    public List<PiezaDTO> buscar(String query) {
        if (query == null || query.trim().length() < 2) return List.of();
        String q = "%" + query.toLowerCase().trim() + "%";
        var resultado = piezaRepository.buscarPublicas(q).stream()
                .filter(p -> p.getArtesano().getRol() != RolUsuario.ADMIN)
                .limit(50)
                .toList();
        return toDTOsBatch(resultado, true);
    }

    /*
     * Piezas relacionadas a una dada (para "Más piezas como esta" en el detalle).
     * Combina misma categoría + mismo artesano. Si la pieza no tiene categoría,
     * solo trae del mismo artesano.
     */
    @Transactional
    public List<PiezaDTO> relacionadas(Long piezaId) {
        Pieza ref = buscarPieza(piezaId);
        String categoria = ref.getCategoria() != null ? ref.getCategoria() : "__nada__";
        Long artesanoId = ref.getArtesano().getId();
        var resultado = piezaRepository.findRelacionadas(piezaId, categoria, artesanoId).stream()
                .limit(4)
                .toList();
        return toDTOsBatch(resultado, true);
    }

    /*
     * Vidriera pública: piezas destacadas de todos los artesanos premium.
     * Limitamos a 12 para no sobrecargar el home y mantener exclusividad
     * (si tenés muchas, las más nuevas se llevan el spotlight).
     */
    @Transactional
    public List<PiezaDTO> listarDestacadasPublicas() {
        return listarDestacadasPublicas(null);
    }

    /*
     * Cupo del feed de destacadas. Más alto que antes (12 → 20) para mostrar
     * más diversidad ahora que el algoritmo rota por artesano.
     */
    private static final int CUPO_DESTACADAS = 20;

    @Transactional
    public List<PiezaDTO> listarDestacadasPublicas(com.nsobrero.blogArtesanos.enums.Oficio oficio) {
        /*
         * Filtramos por destacada=true Y el artesano debe ser premium activo.
         * Esto resuelve el problema de premium expirado: la pieza NO se "desmarca"
         * en DB, pero deja de aparecer como destacada hasta que renueve premium.
         * Al renovar, vuelve a aparecer automáticamente sin que el artesano tenga
         * que tocar nada.
         */
        var todas = piezaRepository.findDestacadasPublicas(EstadoPieza.DISPONIBLE).stream()
                .filter(p -> p.getArtesano().getRol() != RolUsuario.ADMIN)
                .filter(p -> planService.isPremium(p.getArtesano()))
                .filter(p -> oficio == null || oficio.equals(p.getOficio()))
                .toList();

        /*
         * Selección round-robin por artesano para repartir exposición y no
         * saturar el feed con un solo taller que tenga muchas destacadas:
         *
         *  - Vuelta 1: 1 pieza por cada artesano (shuffleada — cada request
         *    elige una distinta de las que tiene ese artesano).
         *  - Vuelta 2: segunda pieza de cada artesano que tenga más, en orden.
         *  - Y así sucesivamente hasta llenar el cupo o agotar piezas.
         */
        java.util.Map<Long, java.util.List<Pieza>> porArtesano = new java.util.LinkedHashMap<>();
        for (Pieza p : todas) {
            porArtesano.computeIfAbsent(p.getArtesano().getId(), k -> new java.util.ArrayList<>()).add(p);
        }
        for (var piezasArt : porArtesano.values()) {
            // Shuffle por artesano → cada request muestra una pieza distinta de cada uno
            java.util.Collections.shuffle(piezasArt);
        }

        var seleccionadas = new java.util.ArrayList<Pieza>();
        int vuelta = 0;
        while (seleccionadas.size() < CUPO_DESTACADAS) {
            boolean agreguéEnEstaVuelta = false;
            for (var piezasArt : porArtesano.values()) {
                if (piezasArt.size() > vuelta) {
                    seleccionadas.add(piezasArt.get(vuelta));
                    agreguéEnEstaVuelta = true;
                    if (seleccionadas.size() >= CUPO_DESTACADAS) break;
                }
            }
            if (!agreguéEnEstaVuelta) break; // ya no quedan más piezas
            vuelta++;
        }

        // Shuffle final para que el orden visual del feed sea variado
        java.util.Collections.shuffle(seleccionadas);
        return toDTOsBatch(seleccionadas, true);
    }

    /*
     * Piezas recientes (no destacadas) para mostrar abajo del spotlight.
     * Le da visibilidad a las cuentas gratis sin quitar valor al premium —
     * éstas aparecen con cards más chicas y sin el destaque dorado.
     * Limit 24 para mostrar bastante variedad sin saturar el home.
     */
    @Transactional
    public List<PiezaDTO> listarRecientesPublicas() {
        return listarRecientesPublicas(null);
    }

    @Transactional
    public List<PiezaDTO> listarRecientesPublicas(com.nsobrero.blogArtesanos.enums.Oficio oficio) {
        // Incluye piezas no-destacadas + las "destacadas-pero-premium-expirado"
        // que ya no aparecen en la vidriera dorada. Así las piezas de premium
        // vencido siguen siendo visibles, solo pierden el destaque.
        var noDestacadas = piezaRepository.findNoDestacadasPublicas(EstadoPieza.DISPONIBLE);
        var destacadasNoVisibles = piezaRepository.findDestacadasPublicas(EstadoPieza.DISPONIBLE)
                .stream()
                .filter(p -> !planService.isPremium(p.getArtesano()))
                .toList();

        var combinadas = new java.util.ArrayList<Pieza>();
        combinadas.addAll(noDestacadas);
        combinadas.addAll(destacadasNoVisibles);

        var resultado = combinadas.stream()
                .filter(p -> p.getArtesano().getRol() != RolUsuario.ADMIN)
                .filter(p -> oficio == null || oficio.equals(p.getOficio()))
                .sorted(Comparator.comparing(Pieza::getFechaCreacion, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(24)
                .toList();
        return toDTOsBatch(resultado, true);
    }

    /*
     * Orden para el catálogo público del perfil de un artesano:
     * 1) DISPONIBLE primero (lo que se puede comprar / encargar ahora)
     * 2) Después destacadas
     * 3) Después por fecha (más nuevas primero)
     * Las vendidas / reservadas / encargo quedan al final como portfolio.
     */
    private static final Comparator<Pieza> ORDEN_PERFIL_PUBLICO =
        Comparator.<Pieza, Boolean>comparing(p -> p.getEstado() == EstadoPieza.DISPONIBLE)
            .reversed()
            .thenComparing(p -> Boolean.TRUE.equals(p.getDestacada()), Comparator.reverseOrder())
            .thenComparing(Pieza::getFechaCreacion, Comparator.nullsLast(Comparator.reverseOrder()));

    /*
     * Feed de Novedades: las últimas piezas DISPONIBLES de toda la comunidad,
     * ordenadas por fecha de creación. Le da a los artesanos una razón de volver
     * (ver qué subieron los demás) y muestra que la plataforma está activa.
     */
    @Transactional
    public List<PiezaDTO> listarNovedades() {
        var resultado = piezaRepository.findTodasPublicas().stream()
                .filter(p -> p.getEstado() == EstadoPieza.DISPONIBLE)
                .sorted(Comparator.comparing(Pieza::getFechaCreacion,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(48)
                .toList();
        return toDTOsBatch(resultado, true);
    }

    @Transactional
    public List<PiezaDTO> listarPublicas(String slug) {
        Artesano artesano = artesanoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));
        var resultado = piezaRepository
                .findPublicasByArtesanoIdWithMateriales(artesano.getId())
                .stream()
                .sorted(ORDEN_PERFIL_PUBLICO)
                .toList();
        return toDTOsBatch(resultado, true);
    }

    @Transactional
    public List<PiezaDTO> listarMias(Long artesanoId) {
        var resultado = piezaRepository.findByArtesanoIdWithMateriales(artesanoId)
                .stream()
                .sorted(ORDEN_DESTACADAS_PRIMERO)
                .toList();
        return toDTOsBatch(resultado, false);
    }

    /*
     * Pieza por id. Recibe opcionalmente el usuario logueado para decidir si
     * se puede ver una pieza oculta:
     *   - Admin: ve cualquier pieza
     *   - Dueño: ve su propia pieza oculta (con el motivo)
     *   - Resto: 404 si está oculta
     */
    @Transactional
    public PiezaDTO obtenerPorId(Long id, Artesano usuario) {
        Pieza p = buscarPieza(id);
        boolean oculta = Boolean.TRUE.equals(p.getOculta());
        if (oculta) {
            boolean esAdmin = usuario != null && usuario.getRol() == RolUsuario.ADMIN;
            boolean esDuenio = usuario != null && p.getArtesano().getId().equals(usuario.getId());
            if (!esAdmin && !esDuenio) {
                throw new RuntimeException("Esta pieza no está disponible");
            }
        }
        return toDTOPublico(p);
    }

    // Sobrecarga sin usuario (visitante anónimo)
    @Transactional
    public PiezaDTO obtenerPorId(Long id) {
        return obtenerPorId(id, null);
    }

    /*
     * Toggle "oculta" desde el panel admin. Si la oculta, guarda el motivo
     * y manda notificación al dueño. Si la des-oculta, limpia el motivo.
     */
    @Transactional
    public void toggleOculta(Long id, String motivo, Long adminId) {
        Pieza p = buscarPieza(id);
        boolean nuevoEstado = !Boolean.TRUE.equals(p.getOculta());
        p.setOculta(nuevoEstado);
        p.setMotivoOculta(nuevoEstado ? motivo : null);
        piezaRepository.save(p);
    }

    @Transactional
    public PiezaDTO crear(PiezaRequest request, Long artesanoId) {
        Artesano artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        // Límite de piezas según el plan
        long piezasActuales = piezaRepository.countByArtesanoId(artesanoId);
        int limite = planService.maxPiezas(artesano);
        if (piezasActuales >= limite) {
            throw new RuntimeException(
                "Llegaste al límite de " + limite + " piezas del plan gratuito. " +
                "Pasate a Premium para piezas ilimitadas."
            );
        }

        Pieza pieza = new Pieza();
        pieza.setTitulo(request.titulo());
        pieza.setDescripcion(request.descripcion());
        pieza.setPrecio(request.precio());
        pieza.setHorasTrabajo(request.horasTrabajo());
        pieza.setCategoria(request.categoria());
        pieza.setOficio(request.oficio()); // obligatorio por @NotNull en el request
        // Destacada solo para premium — silenciosamente fuerza false si no puede
        boolean pideDestacada = request.destacada() != null && request.destacada();
        pieza.setDestacada(pideDestacada && planService.puedeDestacar(artesano));
        pieza.setEstado(request.estado() != null ? request.estado() : EstadoPieza.DISPONIBLE);
        pieza.setArtesano(artesano);

        if (request.materialIds() != null && !request.materialIds().isEmpty()) {
            List<Material> materiales = materialRepository.findAllById(request.materialIds());
            pieza.setMateriales(materiales);
        }

        return toDTO(piezaRepository.save(pieza));
    }

    @Transactional
    public PiezaDTO actualizar(Long id, PiezaRequest request, Long artesanoId) {
        Pieza pieza = buscarPieza(id);

        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para editar esta pieza");
        }

        pieza.setTitulo(request.titulo());
        pieza.setDescripcion(request.descripcion());
        pieza.setPrecio(request.precio());
        pieza.setHorasTrabajo(request.horasTrabajo());
        pieza.setCategoria(request.categoria());
        if (request.oficio() != null) pieza.setOficio(request.oficio());
        if (request.estado() != null) pieza.setEstado(request.estado());
        // Destacada solo si el plan lo permite
        if (request.destacada() != null) {
            pieza.setDestacada(request.destacada() && planService.puedeDestacar(pieza.getArtesano()));
        }

        if (request.materialIds() != null) {
            List<Material> materiales = materialRepository.findAllById(request.materialIds());
            pieza.setMateriales(materiales);
        }

        return toDTO(piezaRepository.save(pieza));
    }

    @Transactional
    public void eliminar(Long id, Long artesanoId) {
        Pieza pieza = buscarPieza(id);
        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para eliminar esta pieza");
        }
        // Borrar dependencias antes para evitar FK constraint violation
        meGustaRepository.deleteByPiezaId(id);
        favoritoRepository.deleteByPiezaId(id);
        comentarioRepository.deleteByPiezaId(id);

        piezaRepository.delete(pieza);
    }

    @Transactional
    public PiezaDTO agregarFoto(Long id, String fotoUrl, Long artesanoId) {
        Pieza pieza = buscarPieza(id);
        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para editar esta pieza");
        }
        int limite = planService.maxFotosPorPieza(pieza.getArtesano());
        if (pieza.getFotos().size() >= limite) {
            throw new RuntimeException(
                "Llegaste al límite de " + limite + " fotos por pieza. " +
                (planService.isPremium(pieza.getArtesano())
                    ? "Eliminá una para subir otra."
                    : "Pasate a Premium para subir hasta 15 fotos por pieza.")
            );
        }
        pieza.getFotos().add(fotoUrl);
        return toDTO(piezaRepository.save(pieza));
    }

    /*
     * Agregar foto a una pieza desde el panel admin (onboarding asistido).
     * No valida propiedad ni límite de plan — es una herramienta operativa
     * para que el admin cargue catálogos en nombre de los artesanos.
     */
    @Transactional
    public PiezaDTO agregarFotoComoAdmin(Long id, String fotoUrl) {
        Pieza pieza = buscarPieza(id);
        pieza.getFotos().add(fotoUrl);
        return toDTO(piezaRepository.save(pieza));
    }

    /*
     * Setear video en una pieza. Solo premium puede.
     * Reemplaza el video anterior si había.
     */
    @Transactional
    public PiezaDTO setVideo(Long id, String videoUrl, Long artesanoId) {
        Pieza pieza = buscarPieza(id);
        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para editar esta pieza");
        }
        if (!planService.isPremium(pieza.getArtesano())) {
            throw new RuntimeException("Subir video es una feature Premium");
        }
        pieza.setVideoUrl(videoUrl);
        return toDTO(piezaRepository.save(pieza));
    }

    @Transactional
    public PiezaDTO eliminarVideo(Long id, Long artesanoId) {
        Pieza pieza = buscarPieza(id);
        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para editar esta pieza");
        }
        pieza.setVideoUrl(null);
        return toDTO(piezaRepository.save(pieza));
    }

    @Transactional
    public PiezaDTO eliminarFoto(Long id, int indice, Long artesanoId) {
        Pieza pieza = buscarPieza(id);
        if (!pieza.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenes permiso para editar esta pieza");
        }
        if (indice < 0 || indice >= pieza.getFotos().size()) {
            throw new RuntimeException("Indice de foto invalido");
        }
        pieza.getFotos().remove(indice);
        return toDTO(piezaRepository.save(pieza));
    }

    private Pieza buscarPieza(Long id) {
        return piezaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada: " + id));
    }

    /*
     * DTO para vista privada del artesano (panel /mis-piezas).
     * Mantiene el flag destacada tal como está en la DB — así el artesano
     * sigue viendo su pieza como "destacada" aunque su premium haya expirado.
     * Cuando renueve premium, vuelve a aparecer públicamente sin tener que tocar nada.
     */
    private PiezaDTO toDTO(Pieza p) {
        return toDTOInterno(p, false,
                meGustaRepository.countByPiezaId(p.getId()),
                comentarioRepository.countByPiezaId(p.getId()));
    }

    /*
     * DTO para vista pública (catálogo, destacadas, recientes, búsqueda, etc.).
     * Si el artesano no tiene premium activo, destacada se reporta como false aunque
     * en la DB esté true — para que el badge dorado no aparezca públicamente.
     */
    private PiezaDTO toDTOPublico(Pieza p) {
        return toDTOInterno(p, true,
                meGustaRepository.countByPiezaId(p.getId()),
                comentarioRepository.countByPiezaId(p.getId()));
    }

    /*
     * Mapeo BATCH de una lista de piezas a DTOs.
     *
     * Antes cada pieza disparaba 2 queries de count (likes + comentarios) — con
     * 40 piezas en el home eran 80 queries por request, y con la latencia de red
     * hacia la DB eso dominaba el tiempo de respuesta. Ahora los counts de TODAS
     * las piezas se traen en 2 queries agrupadas (GROUP BY pieza_id) y se mapean
     * desde memoria.
     */
    private List<PiezaDTO> toDTOsBatch(List<Pieza> piezas, boolean vistaPublica) {
        if (piezas.isEmpty()) return List.of();
        List<Long> ids = piezas.stream().map(Pieza::getId).toList();

        var likesPorPieza = aMapa(meGustaRepository.countAgrupadoPorPieza(ids));
        var comentariosPorPieza = aMapa(comentarioRepository.countAgrupadoPorPieza(ids));

        return piezas.stream()
                .map(p -> toDTOInterno(p, vistaPublica,
                        likesPorPieza.getOrDefault(p.getId(), 0L),
                        comentariosPorPieza.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    /* Convierte el resultado de una query agrupada [id, count] en un mapa id → count */
    private static java.util.Map<Long, Long> aMapa(List<Object[]> filas) {
        var mapa = new java.util.HashMap<Long, Long>();
        for (Object[] fila : filas) {
            mapa.put((Long) fila[0], (Long) fila[1]);
        }
        return mapa;
    }

    private PiezaDTO toDTOInterno(Pieza p, boolean vistaPublica, long likes, long comentarios) {
        List<String> nombresMateriales = p.getMateriales().stream()
                .map(Material::getNombre)
                .toList();

        Boolean destacada = p.getDestacada();
        if (vistaPublica && Boolean.TRUE.equals(destacada)) {
            // En vista pública, solo se considera destacada si el artesano es premium ACTIVO
            destacada = planService.isPremium(p.getArtesano());
        }

        return new PiezaDTO(
                p.getId(), p.getTitulo(), p.getDescripcion(),
                p.getPrecio(), p.getEstado(), p.getOficio(),
                p.getHorasTrabajo(), p.getCategoria(), destacada, p.getFotos(),
                p.getVideoUrl(),
                nombresMateriales, p.getFechaCreacion(),
                p.getArtesano().getNombre(), p.getArtesano().getSlug(),
                p.getArtesano().getId(),
                p.getArtesano().getWhatsapp(),
                likes, comentarios
        );
    }
}