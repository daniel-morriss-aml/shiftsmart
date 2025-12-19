import { Routes } from '@angular/router';
import { StaffListComponent } from './components/staff-list/staff-list.component';
import { ShiftSetupComponent } from './components/shift-setup/shift-setup.component';
import { GenerateRotaComponent } from './components/generate-rota/generate-rota.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/staff', pathMatch: 'full' },
  { path: 'staff', component: StaffListComponent },
  { path: 'shift-setup', component: ShiftSetupComponent },
  { path: 'generate-rota', component: GenerateRotaComponent },
  { path: 'settings', component: SettingsComponent }
];
