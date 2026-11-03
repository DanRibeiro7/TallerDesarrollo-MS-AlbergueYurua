package com.example.demo.controller;

import com.example.demo.model.BitacoraAcceso;
import com.example.demo.model.AlbergadoReferencia;

import com.example.demo.repository.BitacoraAccesoRepository;
import com.example.demo.repository.AlbergadoReferenciaRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/porteria")
@CrossOrigin(origins = "*")
public class PorteriaController {

    @Autowired
    private BitacoraAccesoRepository repository;

    @Autowired
    private AlbergadoReferenciaRepository albergadoRepository;

  @Value("${recepcion.api.url:http://localhost:8000/api/api_albergados.php?accion=listar_sincronizacion}")
private String recepcionUrl;

    private final RestClient restClient = RestClient.builder()
        .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
        .build();

    // ==========================================
    // LISTAR TODOS LOS MOVIMIENTOS
    // ==========================================

    @GetMapping("/listar")
    public List<BitacoraAcceso> listar() {
        return repository.findAll();
    }

    // ==========================================
    // LISTAR ALBERGADOS DESDE BD_PORTERIA
    // ==========================================

    @GetMapping("/albergados")
    public ResponseEntity<?> listarAlbergados() {

        try {

            List<AlbergadoReferencia> albergados =
                    albergadoRepository.findByEstadoIgnoreCase("Activo");

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "data", albergados
            ));

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "No se pudieron consultar los albergados locales."
                    ));
        }
    }

    // ==========================================
    // SINCRONIZAR ALBERGADOS DESDE RECEPCIÓN
    // ==========================================

    @PostMapping("/sincronizar-albergados")
    public ResponseEntity<?> sincronizarAlbergados() {

        try {

            Map<?, ?> respuesta = restClient.get()
                    .uri(recepcionUrl)
                    .retrieve()
                    .body(Map.class);

            if (respuesta == null ||
                    !"success".equals(respuesta.get("status")) ||
                    !(respuesta.get("data") instanceof List<?>)) {

                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of(
                                "status", "error",
                                "message", "Recepción devolvió datos inválidos."
                        ));
            }

            List<?> datos = (List<?>) respuesta.get("data");

            int sincronizados = 0;

            for (Object objeto : datos) {

                if (!(objeto instanceof Map<?, ?> item)) {
                    continue;
                }

                Long id = Long.valueOf(
                        item.get("id_albergado").toString()
                );

                AlbergadoReferencia albergado =
                        albergadoRepository.findById(id)
                                .orElseGet(AlbergadoReferencia::new);

                albergado.setId_albergado(id);
                albergado.setDni(String.valueOf(item.get("dni")));
                albergado.setNombres(String.valueOf(item.get("nombres")));
                albergado.setApellidos(String.valueOf(item.get("apellidos")));
                albergado.setTipo(String.valueOf(item.get("tipo")));
                albergado.setEstado(String.valueOf(item.get("estado")));
                albergado.setUltima_sincronizacion(LocalDateTime.now());

                albergadoRepository.save(albergado);

                sincronizados++;
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Albergados sincronizados correctamente.",
                    "total_albergados", sincronizados
            ));

        } catch (Exception e) {

    System.err.println("ERROR EN SINCRONIZACIÓN DE PORTERÍA:");

    e.printStackTrace();

    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                    "status", "error",
                    "message", "No se pudo sincronizar con Recepción."
            ));
}
    }

    // ==========================================
    // REGISTRAR SALIDA
    // ==========================================

    @PostMapping("/registrar-salida")
    public ResponseEntity<?> registrarSalida(@RequestBody BitacoraAcceso bitacora) {

        if (bitacora.getId_albergado() == null) {

            return ResponseEntity.badRequest()
                    .body("Debe seleccionar un albergado.");
        }

        if (bitacora.getMotivo_salida() == null ||
                bitacora.getMotivo_salida().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Debe ingresar el motivo de salida.");
        }

        // Verificar que el albergado exista en la base local
        boolean existeAlbergado = albergadoRepository
                .findById(bitacora.getId_albergado())
                .filter(a -> "Activo".equalsIgnoreCase(a.getEstado()))
                .isPresent();

        if (!existeAlbergado) {

            return ResponseEntity.badRequest()
                    .body("El albergado no existe o no está activo en Portería.");
        }

        // Evitar registrar otra salida si todavía no ha retornado
        boolean tieneSalidaPendiente = repository.findAll()
                .stream()
                .anyMatch(acceso ->
                        bitacora.getId_albergado().equals(acceso.getId_albergado())
                        && acceso.getFecha_hora_retorno() == null
                );

        if (tieneSalidaPendiente) {

            return ResponseEntity.badRequest()
                    .body("Este albergado ya tiene una salida pendiente de retorno.");
        }

        bitacora.setId_acceso(null);
        bitacora.setFecha_hora_salida(LocalDateTime.now());
        bitacora.setFecha_hora_retorno(null);

        BitacoraAcceso nuevoRegistro = repository.save(bitacora);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(nuevoRegistro);
    }

    // ==========================================
    // REGISTRAR RETORNO
    // ==========================================

    @PutMapping("/registrar-retorno/{id}")
    public ResponseEntity<?> registrarRetorno(@PathVariable Long id) {

        return repository.findById(id)
                .map(acceso -> {

                    if (acceso.getFecha_hora_retorno() != null) {

                        return ResponseEntity.badRequest()
                                .body((Object) "Este albergado ya registró su retorno.");
                    }

                    acceso.setFecha_hora_retorno(LocalDateTime.now());

                    BitacoraAcceso actualizado = repository.save(acceso);

                    return ResponseEntity.ok((Object) actualizado);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body((Object) "No se encontró el registro de salida."));
    }
}