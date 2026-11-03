package com.example.demo.controller;

import com.example.demo.model.BitacoraAcceso;
import com.example.demo.repository.BitacoraAccesoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/porteria")
@CrossOrigin(origins = "*")
public class PorteriaController {

    @Autowired
    private BitacoraAccesoRepository repository;

    // LISTAR TODOS LOS MOVIMIENTOS
    @GetMapping("/listar")
    public List<BitacoraAcceso> listar() {
        return repository.findAll();
    }

    // REGISTRAR SALIDA
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

        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoRegistro);
    }

    // REGISTRAR RETORNO
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