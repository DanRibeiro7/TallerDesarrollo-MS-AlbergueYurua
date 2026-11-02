import { Routes } from '@angular/router';
import { RecepcionComponent } from './components/recepcion/recepcion.component';
import { ComedorComponent } from './components/comedor/comedor.component';
import { PorteriaComponent } from './components/porteria/porteria.component';

export const routes: Routes = [
  { path: 'recepcion', component: RecepcionComponent },
  { path: 'comedor', component: ComedorComponent },
  { path: 'porteria', component: PorteriaComponent },
  { path: '', redirectTo: '/recepcion', pathMatch: 'full' } // Ruta por defecto
];