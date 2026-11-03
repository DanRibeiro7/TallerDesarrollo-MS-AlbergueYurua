import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-comedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comedor.component.html'
})
export class ComedorComponent implements OnInit {

  // ==========================================
  // DATOS DE CONSUMOS
  // ==========================================

  consumos: any[] = [];
  albergadosActivos: any[] = [];

  nuevoConsumo: {
    id_albergado: number | null;
    tipo_comida: string;
    estado_entrega: number;
  } = {
    id_albergado: null,
    tipo_comida: 'Almuerzo',
    estado_entrega: 1
  };

  // ==========================================
  // PLANIFICACIÓN DIARIA
  // ==========================================

  calculoDiario: any = null;

  cargandoCalculo = false;
  guardandoCalculo = false;

  private urlComedor = 'http://localhost:3000/api/comedor';

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarAlbergados();
    this.calcularRaciones();
  }

  // ==========================================
  // LISTAR CONSUMOS
  // ==========================================

  cargarDatos(): void {

    this.apiService.getComedorDatos().subscribe({

      next: (res: any) => {

        if (res.status === 'success') {
          this.consumos = res.data;
        }

      },

      error: (error: any) => {
        console.error('Error al cargar consumos:', error);
      }

    });
  }

  // ==========================================
  // CONSULTAR ALBERGADOS ACTIVOS
  // ==========================================

  // ==========================================
// CONSULTAR ALBERGADOS DESDE COMEDOR (NODE.JS)
// ==========================================

cargarAlbergados(): void {

  this.apiService.getComedorAlbergados().subscribe({

    next: (res: any) => {

      if (res.status === 'success' && Array.isArray(res.data)) {

        this.albergadosActivos = res.data.map((item: any) => ({
          ...item,
          id_albergado: Number(item.id_albergado)
        }));

        console.log(
          'Albergados cargados desde Comedor:',
          this.albergadosActivos.length
        );

      } else {

        console.error('Respuesta inválida de Comedor:', res);
        this.albergadosActivos = [];

      }

    },

    error: (error: any) => {

      console.error(
        'Error al cargar albergados desde Comedor:',
        error
      );

      alert(
        'No se pudieron cargar los albergados desde Comedor.'
      );

    }

  });
}

  // ==========================================
  // MOSTRAR NOMBRE DEL ALBERGADO
  // ==========================================

  obtenerNombreAlbergado(id: number): string {

    const albergado = this.albergadosActivos.find(
      (item: any) =>
        Number(item.id_albergado) === Number(id)
    );

    return albergado
      ? `${albergado.nombres} ${albergado.apellidos}`
      : `ID ${id}`;
  }

  // ==========================================
  // REGISTRAR CONSUMO
  // ==========================================

  registrar(): void {

    if (!this.nuevoConsumo.id_albergado) {

      alert('Debe seleccionar un albergado.');

      return;
    }

    this.apiService.registrarConsumo(this.nuevoConsumo).subscribe({

      next: (res: any) => {

        if (res.status === 'success') {

          alert(
            res.message || 'Ración registrada correctamente.'
          );

          this.cargarDatos();

          this.nuevoConsumo.id_albergado = null;

        } else {

          alert(
            res.message || 'No se pudo registrar el consumo.'
          );

        }

      },

      error: (error: any) => {

        console.error('Error al registrar consumo:', error);

        alert(
          error.error?.message ||
          'No se pudo registrar el consumo.'
        );

      }

    });
  }

  // ==========================================
  // CALCULAR RACIONES DEL DÍA
  // ==========================================

  calcularRaciones(): void {

    this.cargandoCalculo = true;

    const url = `${this.urlComedor}/calculo-hoy`;

    this.http.get<any>(url).subscribe({

      next: (res: any) => {

        this.cargandoCalculo = false;

        if (res.status === 'success') {

          this.calculoDiario = res;

        } else {

          this.calculoDiario = null;

          alert(
            res.message || 'No se pudieron calcular las raciones.'
          );

        }

      },

      error: (error: any) => {

        this.cargandoCalculo = false;

        this.calculoDiario = null;

        console.error('Error al calcular raciones:', error);

        alert(
          error.error?.message ||
          'No se pudo consultar la planificación diaria.'
        );

      }

    });
  }

  // ==========================================
  // GUARDAR PLANIFICACIÓN DIARIA
  // ==========================================

  guardarPlanificacion(): void {

    if (!this.calculoDiario) {

      alert('Primero debe calcular las raciones.');

      return;
    }

    if (this.guardandoCalculo) {
      return;
    }

    this.guardandoCalculo = true;

    const url = `${this.urlComedor}/guardar-calculo`;

    this.http.post<any>(url, {}).subscribe({

      next: (res: any) => {

        this.guardandoCalculo = false;

        if (res.status === 'success') {

          // Mostrar los valores que realmente guardó Node.js
          this.calculoDiario = res;

          alert(
            res.message ||
            'Planificación diaria guardada correctamente.'
          );

        } else {

          alert(
            res.message ||
            'No se pudo guardar la planificación.'
          );

        }

      },

      error: (error: any) => {

        this.guardandoCalculo = false;

        console.error('Error al guardar planificación:', error);

        alert(
          error.error?.message ||
          'No se pudo guardar la planificación diaria.'
        );

      }

    });
  }
// ==========================================
// MARCAR COMIDA COMO ENTREGADA
// ==========================================

marcarEntregado(item: any): void {

  if (Number(item.estado_entrega) === 1) {
    alert('Esta comida ya fue entregada.');
    return;
  }

  const confirmar = confirm(
    `¿Confirmas que deseas marcar como entregada la comida de ${this.obtenerNombreAlbergado(item.id_albergado)}?`
  );

  if (!confirmar) {
    return;
  }

  const url = `${this.urlComedor}/marcar-entregado`;

  this.http.post<any>(url, {
    id_consumo: item.id_consumo
  }).subscribe({

    next: (res: any) => {

      if (res.status === 'success') {

        alert(res.message);

        // Actualizar la tabla
        this.cargarDatos();

      } else {

        alert(res.message || 'No se pudo actualizar el consumo.');

      }

    },

    error: (error: any) => {

      console.error('Error al marcar como entregado:', error);

      alert(
        error.error?.message ||
        'No se pudo actualizar el estado del consumo.'
      );

    }

  });

}
}