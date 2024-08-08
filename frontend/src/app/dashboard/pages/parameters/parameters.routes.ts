import { Routes } from '@angular/router';

export const routesParameters: Routes = [
  {
    path: 'permisos',
    title: 'Permisos',
    data: { icon: 'manage_accounts'},
    loadComponent: () =>
      import('./permissions/list/permissions.component'),
  },
  {
    path: 'programas',
    title: 'Programas',
    data: { icon: 'manage_accounts'},

    loadComponent: () =>
      import('./programs/list/programs.component'),
  },
  {
    path: 'profesional-roles',
    title: 'Cargos',
    data: { icon: 'manage_accounts'},
    loadComponent: () =>
      import('./profesionalRole/list/profesionalRole.component'),
  }
];
