import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recepcion.component.html',
  styleUrls: ['./recepcion.component.css']
})
export class RecepcionComponent implements OnInit {
  albergados: any[] = [];
  habitacionesDisponibles: any[] = [];
  pacientesActivos: any[] = [];
  
  nuevoAlbergado: any = {
    id_albergado: null, // Si tiene ID, sabemos que estamos editando
    nombres: '',
    apellidos: '',
    dni: '',
    comunidad_origen: '',
    tipo: 'Paciente',
    id_habitacion: '',
    id_paciente_vinculado: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.listarAlbergados();
    this.cargarHabitaciones(); // Carga las habitaciones para 'Paciente' por defecto al inicio
  }

  listarAlbergados() {
    const url = 'http://localhost:8000/api/api_albergados.php?accion=listar';
    this.http.get<any>(url).subscribe(
      (res: any) => {
        if (res.status === 'success') {
          this.albergados = res.data;
        }
      },
      (error: any) => console.error("Error al listar", error)
    );
  }

  cargarHabitaciones() {
    if (!this.nuevoAlbergado.tipo) return;

    const url = `http://localhost:8000/api/api_albergados.php?accion=habitaciones_disponibles&tipo=${this.nuevoAlbergado.tipo}`;
    
    this.http.get<any>(url).subscribe(
      (res: any) => {
        if (res.status === 'success') {
          this.habitacionesDisponibles = res.data;
          // Si es un registro nuevo, limpiamos la selección de cuarto. Si estamos editando, mantenemos la que tiene.
          if (!this.nuevoAlbergado.id_albergado) {
            this.nuevoAlbergado.id_habitacion = ''; 
          }
        }
      },
      (error: any) => console.error("Error al cargar habitaciones", error)
    );
  }
  cargarPacientes() {
  const url = 'http://localhost:8000/api/api_albergados.php?accion=listar';

  this.http.get<any>(url).subscribe({
    next: (res: any) => {
      if (res.status === 'success') {
        this.pacientesActivos = res.data
          .filter((item: any) =>
            item.tipo === 'Paciente' &&
            item.estado === 'Activo'
          )
          .map((item: any) => ({
            ...item,
            id_albergado: Number(item.id_albergado)
          }));
      }
    },
    error: (error: any) => {
      console.error('Error al cargar pacientes', error);
    }
  });
}

cambiarTipo() {
  this.nuevoAlbergado.id_paciente_vinculado = null;

  // Limpiar la habitación al cambiar de tipo
  this.nuevoAlbergado.id_habitacion = '';

  this.cargarHabitaciones();

  if (this.nuevoAlbergado.tipo === 'Acompañante') {
    this.cargarPacientes();
  }
}

  // Valida que solo se ingresen números y limpia la variable
  soloNumeros(event: any) {
    const valorLimpio = event.target.value.replace(/[^0-9]/g, '');
    this.nuevoAlbergado.dni = valorLimpio;
    event.target.value = valorLimpio; 
  }

  // Toma los datos de la fila y los sube al formulario
  seleccionarParaEditar(albergado: any) {
  this.nuevoAlbergado = {
    ...albergado,
    id_paciente_vinculado:
      albergado.id_paciente_vinculado != null
        ? Number(albergado.id_paciente_vinculado)
        : null,
    id_habitacion: ''
  };

  this.cargarHabitaciones();

  if (this.nuevoAlbergado.tipo === 'Acompañante') {
    this.cargarPacientes();
  }
}

  // Limpia el formulario y vuelve al modo de registro nuevo
  cancelarEdicion() {
  this.nuevoAlbergado = {
    id_albergado: null,
    nombres: '',
    apellidos: '',
    dni: '',
    comunidad_origen: '',
    tipo: 'Paciente',
    id_habitacion: '',
    id_paciente_vinculado: null
  };

  this.cargarHabitaciones();
}
obtenerNombrePaciente(idPaciente: any): string {
  if (!idPaciente) {
    return '—';
  }

  const paciente = this.albergados.find(
    (item: any) => Number(item.id_albergado) === Number(idPaciente)
  );

  return paciente
    ? `${paciente.nombres} ${paciente.apellidos}`
    : 'Paciente no disponible';
}
  registrar() {
    // 1. Validar nombres y apellidos siempre
    if (!this.nuevoAlbergado.nombres || !this.nuevoAlbergado.apellidos) {
      alert("Nombres y apellidos son obligatorios.");
      return;
    }

    // 2. Si es un registro NUEVO, la habitación es obligatoria
    if (!this.nuevoAlbergado.id_albergado && !this.nuevoAlbergado.id_habitacion) {
      alert("Debe seleccionar una habitación para el nuevo registro.");
      return;
    }

    if (this.nuevoAlbergado.dni && this.nuevoAlbergado.dni.length !== 8) {
      alert("El DNI debe contener exactamente 8 números.");
      return;
    }
    
    if (
  this.nuevoAlbergado.tipo === 'Acompañante' &&
  !this.nuevoAlbergado.id_paciente_vinculado
) {
  alert('Debe seleccionar el paciente al que acompaña.');
  return;
}

if (this.nuevoAlbergado.tipo !== 'Acompañante') {
  this.nuevoAlbergado.id_paciente_vinculado = null;
}

    let accion = this.nuevoAlbergado.id_albergado ? 'editar' : 'registrar';
    const url = `http://localhost:8000/api/api_albergados.php?accion=${accion}`;
    
    this.http.post<any>(url, this.nuevoAlbergado).subscribe(
      (res: any) => {
        if (res.status === 'success') {
          alert(res.message);
          this.cancelarEdicion(); 
          this.listarAlbergados(); 
        } else {
          alert("Error: " + res.message);
        }
      },
      (error: any) => {
  console.error(`Error al ${accion}`, error);

  alert(
    error.error?.message ||
    "No se pudo completar la operación."
  );
}
    );
  }
  darBaja(id: number) {
    if(confirm("¿Estás seguro de dar de baja a este albergado? Liberará su espacio en la habitación.")) {
      const url = 'http://localhost:8000/api/api_albergados.php?accion=dar_baja';
      
      this.http.post<any>(url, { id_albergado: id }).subscribe(
        (res: any) => {
          if (res.status === 'success') {
            alert(res.message);
            this.listarAlbergados(); // La tabla se actualiza y el registro desaparece de los 'Activos'
            this.cargarHabitaciones();
          } else {
            alert("Error: " + res.message);
          }
        },
        (error: any) => console.error("Error al dar de baja", error)
      );
    }
  }
}