import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './porteria.component.html'
})
export class PorteriaComponent implements OnInit {
  accesos: any[] = [];
  nuevaSalida = { id_albergado: null, motivo_salida: '', observaciones: '' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos() {
    this.apiService.getPorteriaDatos().subscribe(res => {
      this.accesos = res.data ? res.data : res; 
    });
  }

  registrar() {
    this.apiService.registrarSalida(this.nuevaSalida).subscribe(res => {
      alert('Salida registrada en portería');
      this.cargarDatos();
      this.nuevaSalida = { id_albergado: null, motivo_salida: '', observaciones: '' };
    });
  }
}