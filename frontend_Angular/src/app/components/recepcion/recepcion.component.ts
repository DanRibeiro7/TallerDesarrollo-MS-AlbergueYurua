import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- IMPORTANTE
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- AGREGAR AQUÍ
  templateUrl: './recepcion.component.html'
})
export class RecepcionComponent implements OnInit {
  albergados: any[] = [];
  // Objeto para el formulario
  nuevoAlbergado = { nombres: '', apellidos: '', tipo: 'Paciente' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos() {
    this.apiService.getRecepcionDatos().subscribe(res => {
      this.albergados = res.data; 
    });
  }

  registrar() {
    this.apiService.registrarAlbergado(this.nuevoAlbergado).subscribe(res => {
      alert('Albergado registrado correctamente');
      this.cargarDatos(); // Recargar tabla
      this.nuevoAlbergado = { nombres: '', apellidos: '', tipo: 'Paciente' }; // Limpiar
    });
  }
}