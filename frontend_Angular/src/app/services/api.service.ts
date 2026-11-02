import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // GETs (Listar)
  private urlRecepcionListar = 'http://localhost:8000/api/api_albergados.php?accion=listar';
  private urlComedorListar = 'http://localhost:3000/api/comedor/listar';
  private urlPorteriaListar = 'http://localhost:8080/api/porteria/listar';

  // POSTs (Insertar)
  private urlRecepcionRegistrar = 'http://localhost:8000/api/api_albergados.php?accion=registrar';
  private urlComedorInsertar = 'http://localhost:3000/api/comedor/insertar';
  private urlPorteriaRegistrar = 'http://localhost:8080/api/porteria/registrar-salida';

  constructor(private http: HttpClient) { }

  getRecepcionDatos(): Observable<any> { return this.http.get(this.urlRecepcionListar); }
  getComedorDatos(): Observable<any> { return this.http.get(this.urlComedorListar); }
  getPorteriaDatos(): Observable<any> { return this.http.get(this.urlPorteriaListar); }

  // Nuevas funciones para guardar
  registrarAlbergado(datos: any): Observable<any> { return this.http.post(this.urlRecepcionRegistrar, datos); }
  registrarConsumo(datos: any): Observable<any> { return this.http.post(this.urlComedorInsertar, datos); }
  registrarSalida(datos: any): Observable<any> { return this.http.post(this.urlPorteriaRegistrar, datos); }
}