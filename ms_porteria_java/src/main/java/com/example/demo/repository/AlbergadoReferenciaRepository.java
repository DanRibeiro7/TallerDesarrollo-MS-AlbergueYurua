package com.example.demo.repository;

import com.example.demo.model.AlbergadoReferencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbergadoReferenciaRepository
        extends JpaRepository<AlbergadoReferencia, Long> {

    List<AlbergadoReferencia> findByEstadoIgnoreCase(String estado);

}