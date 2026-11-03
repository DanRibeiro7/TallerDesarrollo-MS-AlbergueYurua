import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

// ==========================================
// INTERFACES
// ==========================================

interface Acceso {
  id_acceso: number;
  id_albergado: number;
  fecha_hora_salida: string;
  fecha_hora_retorno: string | null;
  motivo_salida: string;
  observaciones: string | null;
}

interface Albergado {
  id_albergado: number;
  dni: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  estado: string;
}

// ==========================================
// COMPONENTE DE PORTERÍA
// ==========================================

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './porteria.component.html'
})
export class PorteriaComponent implements OnInit {

  // ==========================================
  // DATOS
  // ==========================================

  accesos: Acceso[] = [];
  albergadosActivos: Albergado[] = [];

  nuevaSalida: {
    id_albergado: number | null;
    motivo_salida: string;
    observaciones: string;
  } = {
    id_albergado: null,
    motivo_salida: '',
    observaciones: ''
  };

  // ==========================================
  // ESTADOS
  // ==========================================

  cargando = false;
  cargandoAlbergados = false;
  guardando = false;

  retornoEnProceso: number | null = null;

  mensajeExito = '';
  mensajeError = '';

  constructor(private apiService: ApiService) {}

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarAlbergados();
  }

  // ==========================================
  // LISTAR MOVIMIENTOS
  // ==========================================

  cargarDatos(): void {

    this.cargando = true;
    this.mensajeError = '';

    this.apiService.getPorteriaDatos().subscribe({

      next: (res: any) => {

        const datos = res?.data ?? res;

        this.accesos = Array.isArray(datos)
          ? datos
          : [];

        this.cargando = false;
      },

      error: (error: any) => {

        console.error(
          'Error al cargar movimientos:',
          error
        );

        this.mensajeError =
          'No se pudieron cargar los movimientos de portería.';

        this.cargando = false;
      }

    });
  }

  // ==========================================
  // CONSULTAR ALBERGADOS DESDE JAVA
  // ==========================================

  cargarAlbergados(): void {

    this.cargandoAlbergados = true;

    this.apiService.getPorteriaAlbergados().subscribe({

      next: (res: any) => {

        if (
          res.status === 'success' &&
          Array.isArray(res.data)
        ) {

          this.albergadosActivos = res.data.map(
            (item: any) => ({
              ...item,
              id_albergado: Number(item.id_albergado)
            })
          );

        } else {

          this.albergadosActivos = [];

          this.mensajeError =
            'No se pudieron consultar los albergados locales.';
        }

        this.cargandoAlbergados = false;
      },

      error: (error: any) => {

        console.error(
          'Error al cargar albergados de Portería:',
          error
        );

        this.albergadosActivos = [];

        this.mensajeError =
          'No se pudieron cargar los albergados desde Portería.';

        this.cargandoAlbergados = false;
      }

    });
  }

  // ==========================================
  // OBTENER NOMBRE DEL ALBERGADO
  // ==========================================

  obtenerNombreAlbergado(id: number): string {

    const albergado = this.albergadosActivos.find(
      (item: Albergado) =>
        Number(item.id_albergado) === Number(id)
    );

    if (albergado) {

      return `${albergado.nombres} ${albergado.apellidos}`;

    }

    return `ID ${id}`;
  }

  // ==========================================
  // OBTENER DNI DEL ALBERGADO
  // ==========================================

  obtenerDniAlbergado(id: number): string {

    const albergado = this.albergadosActivos.find(
      (item: Albergado) =>
        Number(item.id_albergado) === Number(id)
    );

    return albergado
      ? albergado.dni
      : 'No disponible';
  }

  // ==========================================
  // REGISTRAR SALIDA
  // ==========================================

  registrar(): void {

    this.mensajeExito = '';
    this.mensajeError = '';

    if (
      this.nuevaSalida.id_albergado === null ||
      !Number.isInteger(Number(this.nuevaSalida.id_albergado)) ||
      Number(this.nuevaSalida.id_albergado) <= 0
    ) {

      this.mensajeError =
        'Debe seleccionar un albergado.';

      return;
    }

    const albergadoSeleccionado =
      this.albergadosActivos.find(
        (item: Albergado) =>
          Number(item.id_albergado) ===
          Number(this.nuevaSalida.id_albergado)
      );

    if (!albergadoSeleccionado) {

      this.mensajeError =
        'Seleccione un albergado válido.';

      return;
    }

    if (!this.nuevaSalida.motivo_salida.trim()) {

      this.mensajeError =
        'Ingrese el motivo de salida.';

      return;
    }

    if (this.guardando) {
      return;
    }

    this.guardando = true;

    this.apiService.registrarSalida(this.nuevaSalida).subscribe({

      next: () => {

        this.mensajeExito =
          'Salida registrada correctamente.';

        this.guardando = false;

        this.nuevaSalida = {
          id_albergado: null,
          motivo_salida: '',
          observaciones: ''
        };

        this.cargarDatos();
      },

      error: (err: any) => {

        this.guardando = false;

        this.mensajeError =
          typeof err.error === 'string'
            ? err.error
            : 'No se pudo registrar la salida.';
      }

    });
  }

  // ==========================================
  // REGISTRAR RETORNO
  // ==========================================

  registrarRetorno(acceso: Acceso): void {

    this.mensajeExito = '';
    this.mensajeError = '';

    if (acceso.fecha_hora_retorno !== null) {

      this.mensajeError =
        'Este albergado ya registró su retorno.';

      return;
    }

    const nombre = this.obtenerNombreAlbergado(
      acceso.id_albergado
    );

    const confirmar = confirm(
      `¿Desea registrar el retorno de ${nombre}?`
    );

    if (!confirmar) {
      return;
    }

    if (this.retornoEnProceso !== null) {
      return;
    }

    this.retornoEnProceso = acceso.id_acceso;

    this.apiService.registrarRetorno(
      acceso.id_acceso
    ).subscribe({

      next: () => {

        this.retornoEnProceso = null;

        this.mensajeExito =
          `Retorno de ${nombre} registrado correctamente.`;

        this.cargarDatos();
      },

      error: (err: any) => {

        this.retornoEnProceso = null;

        this.mensajeError =
          typeof err.error === 'string'
            ? err.error
            : 'No se pudo registrar el retorno.';
      }

    });
  }

  // ==========================================
  // ESTADO DEL MOVIMIENTO
  // ==========================================

  obtenerEstado(acceso: Acceso): string {

    return acceso.fecha_hora_retorno === null
      ? 'FUERA'
      : 'RETORNÓ';
  }

}