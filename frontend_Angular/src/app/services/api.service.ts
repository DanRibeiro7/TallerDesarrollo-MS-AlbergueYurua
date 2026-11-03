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
  private urlPorteriaAlbergados = 'http://localhost:8080/api/porteria/albergados';
  private urlComedorAlbergados = 'http://localhost:3000/api/comedor/albergados';

  // POSTs (Insertar)
  private urlRecepcionRegistrar = 'http://localhost:8000/api/api_albergados.php?accion=registrar';
  private urlComedorInsertar = 'http://localhost:3000/api/comedor/insertar';
  private urlPorteriaRegistrar = 'http://localhost:8080/api/porteria/registrar-salida';

  // PUTs (Actualizar)
  private urlPorteriaRetorno = 'http://localhost:8080/api/porteria/registrar-retorno';

  constructor(private http: HttpClient) { }

  // LISTAR
  getRecepcionDatos(): Observable<any> {
    return this.http.get(this.urlRecepcionListar);
  }

  getComedorDatos(): Observable<any> {
    return this.http.get(this.urlComedorListar);
  }
  getComedorAlbergados(): Observable<any> {
  return this.http.get(this.urlComedorAlbergados);
}
  getPorteriaDatos(): Observable<any> {
    return this.http.get(this.urlPorteriaListar);
  }
// LISTAR ALBERGADOS DESDE LA BASE LOCAL DE PORTERÍA
getPorteriaAlbergados(): Observable<any> {
  return this.http.get(this.urlPorteriaAlbergados);
}

  // REGISTRAR
  registrarAlbergado(datos: any): Observable<any> {
    return this.http.post(this.urlRecepcionRegistrar, datos);
  }

  registrarConsumo(datos: any): Observable<any> {
    return this.http.post(this.urlComedorInsertar, datos);
  }

  registrarSalida(datos: any): Observable<any> {
    return this.http.post(this.urlPorteriaRegistrar, datos);
  }

  // REGISTRAR RETORNO
  registrarRetorno(idAcceso: number): Observable<any> {
    return this.http.put(`${this.urlPorteriaRetorno}/${idAcceso}`, {});
  }
}