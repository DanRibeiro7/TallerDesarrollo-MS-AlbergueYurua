import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './porteria.component.html'
})
export class PorteriaComponent implements OnInit {
  accesos: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getPorteriaDatos().subscribe(res => {
      // Spring Boot suele devolver el arreglo directo, si viene en 'data' usamos res.data
      this.accesos = res.data ? res.data : res; 
    });
  }
}