package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bitacora_accesos")
public class BitacoraAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_acceso;

    private Long id_albergado;
    private LocalDateTime fecha_hora_salida;
    private String motivo_salida;
    private LocalDateTime fecha_hora_retorno;
    private String observaciones;

    public Long getId_acceso() { return id_acceso; }
    public void setId_acceso(Long id_acceso) { this.id_acceso = id_acceso; }
    public Long getId_albergado() { return id_albergado; }
    public void setId_albergado(Long id_albergado) { this.id_albergado = id_albergado; }
    public LocalDateTime getFecha_hora_salida() { return fecha_hora_salida; }
    public void setFecha_hora_salida(LocalDateTime fecha_hora_salida) { this.fecha_hora_salida = fecha_hora_salida; }
    public String getMotivo_salida() { return motivo_salida; }
    public void setMotivo_salida(String motivo_salida) { this.motivo_salida = motivo_salida; }
    public LocalDateTime getFecha_hora_retorno() { return fecha_hora_retorno; }
    public void setFecha_hora_retorno(LocalDateTime fecha_hora_retorno) { this.fecha_hora_retorno = fecha_hora_retorno; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}