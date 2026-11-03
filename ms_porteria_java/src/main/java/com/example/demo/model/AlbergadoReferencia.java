package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "albergados_referencia")
public class AlbergadoReferencia {

    @Id
    private Long id_albergado;

    private String dni;
    private String nombres;
    private String apellidos;
    private String tipo;
    private String estado;

    private LocalDateTime ultima_sincronizacion;

    public Long getId_albergado() {
        return id_albergado;
    }

    public void setId_albergado(Long id_albergado) {
        this.id_albergado = id_albergado;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getUltima_sincronizacion() {
        return ultima_sincronizacion;
    }

    public void setUltima_sincronizacion(
            LocalDateTime ultima_sincronizacion) {
        this.ultima_sincronizacion = ultima_sincronizacion;
    }
}