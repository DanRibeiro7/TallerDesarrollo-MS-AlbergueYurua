import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Acceso {
  id_acceso: number;
  id_albergado: number;
  fecha_hora_salida: string;
  fecha_hora_retorno: string | null;
  motivo_salida: string;
  observaciones: string | null;
}

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './porteria.component.html'
})
export class PorteriaComponent implements OnInit {

  accesos: Acceso[] = [];

  nuevaSalida: {
    id_albergado: number | null;
    motivo_salida: string;
    observaciones: string;
  } = {
    id_albergado: null,
    motivo_salida: '',
    observaciones: ''
  };

  cargando = false;
  guardando = false;
  retornoEnProceso: number | null = null;

  mensajeExito = '';
  mensajeError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // LISTAR MOVIMIENTOS
  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.apiService.getPorteriaDatos().subscribe({
      next: (res: any) => {
        const datos = res?.data ?? res;

        this.accesos = Array.isArray(datos) ? datos : [];
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los movimientos de portería.';
        this.cargando = false;
      }
    });
  }

  // REGISTRAR SALIDA
  registrar(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (
      this.nuevaSalida.id_albergado === null ||
      !Number.isInteger(Number(this.nuevaSalida.id_albergado)) ||
      Number(this.nuevaSalida.id_albergado) <= 0
    ) {
      this.mensajeError = 'Ingrese un ID de albergado válido.';
      return;
    }

    if (!this.nuevaSalida.motivo_salida.trim()) {
      this.mensajeError = 'Ingrese el motivo de salida.';
      return;
    }

    if (this.guardando) {
      return;
    }

    this.guardando = true;

    this.apiService.registrarSalida(this.nuevaSalida).subscribe({
      next: () => {
        this.mensajeExito = 'Salida registrada correctamente.';
        this.guardando = false;

        this.nuevaSalida = {
          id_albergado: null,
          motivo_salida: '',
          observaciones: ''
        };

        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;

        this.mensajeError =
          typeof err.error === 'string'
            ? err.error
            : 'No se pudo registrar la salida.';
      }
    });
  }

  // REGISTRAR RETORNO
  registrarRetorno(acceso: Acceso): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (acceso.fecha_hora_retorno !== null) {
      this.mensajeError = 'Este albergado ya registró su retorno.';
      return;
    }

    const confirmar = confirm(
      `¿Desea registrar el retorno del albergado ${acceso.id_albergado}?`
    );

    if (!confirmar) {
      return;
    }

    this.retornoEnProceso = acceso.id_acceso;

    this.apiService.registrarRetorno(acceso.id_acceso).subscribe({
      next: () => {
        this.retornoEnProceso = null;
        this.mensajeExito = 'Retorno registrado correctamente.';
        this.cargarDatos();
      },
      error: (err) => {
        this.retornoEnProceso = null;

        this.mensajeError =
          typeof err.error === 'string'
            ? err.error
            : 'No se pudo registrar el retorno.';
      }
    });
  }

  // ESTADO DEL MOVIMIENTO
  obtenerEstado(acceso: Acceso): string {
    return acceso.fecha_hora_retorno === null
      ? 'FUERA'
      : 'RETORNÓ';
  }
}