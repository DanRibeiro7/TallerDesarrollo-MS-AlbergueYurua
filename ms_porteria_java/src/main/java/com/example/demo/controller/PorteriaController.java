package com.example.demo.controller;

import com.example.demo.model.BitacoraAcceso;
import com.example.demo.repository.BitacoraAccesoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/porteria")
@CrossOrigin(origins = "*")
public class PorteriaController {

    @Autowired
    private BitacoraAccesoRepository repository;

    @GetMapping("/listar")
    public List<BitacoraAcceso> listar() {
        return repository.findAll();
    }

    @PostMapping("/registrar-salida")
    public BitacoraAcceso registrarSalida(@RequestBody BitacoraAcceso bitacora) {
        bitacora.setFecha_hora_salida(LocalDateTime.now());
        return repository.save(bitacora);
    }
}