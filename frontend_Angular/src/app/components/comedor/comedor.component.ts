import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-comedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comedor.component.html'
})
export class ComedorComponent implements OnInit {
  consumos: any[] = [];
  nuevoConsumo = { id_albergado: null, tipo_comida: 'Almuerzo', estado_entrega: 1 };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos() {
    this.apiService.getComedorDatos().subscribe(res => {
      this.consumos = res.data; 
    });
  }

  registrar() {
    this.apiService.registrarConsumo(this.nuevoConsumo).subscribe(res => {
      alert('Ración registrada');
      this.cargarDatos();
      this.nuevoConsumo.id_albergado = null; // Limpiar ID
    });
  }
}