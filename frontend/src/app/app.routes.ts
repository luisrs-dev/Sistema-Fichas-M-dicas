import { Routes } from '@angular/router';
import { isAuthenticatedGuard } from './auth/guards/isAuthenticated.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    data: { icon: 'dashboard' },
    canActivate: [isAuthenticatedGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },

      {
        path: 'home',
        title: 'Bienvenido',
        data: { icon: 'group', child: true, forAdmin: true },
        loadComponent: () =>
          import('./dashboard/pages/home/home.component'),
      },
      {
        path: 'users',
        title: 'Profesionales',
        data: { icon: 'group', child: false, forAdmin: true },
        loadComponent: () =>
          import('./dashboard/pages/users/list/list.component'),
      },
      {
        path: 'users/nuevo',
        title: 'Nuevo Usiaro',
        data: { icon: 'user', child: true },
        loadComponent: () =>
          import('./dashboard/pages/users/new/new.component'),
      },
      {
        path: 'users/nuevo/:id',
        title: 'Nuevo Usiaro',
        data: { icon: 'user', child: true },
        loadComponent: () =>
          import('./dashboard/pages/users/new/new.component'),
      },
      {
        path: 'patients',
        title: 'Pacientes',
        data: { icon: 'group', child: false },
        loadComponent: () =>
          import('./dashboard/pages/patients/listPatients/listPatients.component'),
      },
      {
        path: 'patients/nuevo',
        title: 'Nuevo Paciente',
        data: { icon: 'group', child: true },
        loadComponent: () =>
          import('./dashboard/pages/patients/newPatient/newPatient.component'),
      },
      {
        path: 'patients/nuevo/:id',
        title: 'Editar demanda',
        data: { icon: 'group', child: true },
        loadComponent: () =>
          import('./dashboard/pages/patients/newPatient/newPatient.component'),
      },
      {
        path: 'patient/:id/ficha-clinica/nueva',
        title: 'Nueva Ficha',
        data: { icon: 'group', child: true },
        loadComponent: () =>
          import('./dashboard/pages/medicalRecord/new/new.component'),
      },
      {
        path: 'patient/:id',
        title: 'Información Paciente',
        data: { icon: 'group', child: false },
        loadComponent: () =>
          import('./dashboard/pages/patients/detail/detail.component'),
      },
      {
        path: 'patient/demand/:id',
        title: 'Ficha Demanda',
        data: { icon: 'group', child: false },
        loadComponent: () =>
          import('./dashboard/pages/patients/demand/demand.component'),
      },
      {
        path: 'patient/admision-form/:id',
        title: 'Ficha de ingreso',
        data: { icon: 'group', child: false },
        loadComponent: () =>
          import('./dashboard/pages/patients/admisionForm/admisionForm.component'),
      },
      //{
      //  path: 'fichas-medicas',
      //  title: 'Fichas Clínicas',
      //  data: { icon: 'description', child: false },
      //  loadComponent: () =>
      //    import('./dashboard/pages/medicalRecord/list/list.component'),
      //},
      // {
      //   path: 'fichas-medicas/nueva',
      //   title: 'Nuevo Fiha Médica',
      //   data: { icon: 'user', child: true },
      //   loadComponent: () =>
      //     import('./dashboard/pages/medicalRecord/new/new.component'),
      // },
      {
        path: 'estadisticas',
        title: 'Estadísticas',
        data: { icon: 'analytics', child: false },

        loadComponent: () =>
          import('./dashboard/pages/statistics/statistics.component'),
      },
      {
        path: 'permisos',
        title: 'Permisos',
        data: { icon: 'manage_accounts', parameter: true},
        loadComponent: () =>
          import('./dashboard/pages/parameters/permissions/list/permissions.component'),
      },
      {
        path: 'programas',
        title: 'Programas',
        data: { icon: 'manage_accounts', parameter: true},

        loadComponent: () =>
          import('./dashboard/pages/parameters/programs/list/programs.component'),
      },
      {
        path: 'profesional-roles',
        title: 'Cargos',
        data: { icon: 'manage_accounts', parameter: true},
        loadComponent: () =>
          import('./dashboard/pages/parameters/profesionalRole/list/profesionalRole.component'),
      },
      {
        path: 'prestaciones',
        title: 'Prestaciones',
        data: { icon: 'manage_accounts', parameter: true},
        loadComponent: () =>
          import('./dashboard/pages/parameters/services/list/service.component'),
      }
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/pages/login/login.component'),
  },
  {
    path: '',
    redirectTo: 'dashboard/home',
    pathMatch: 'full',
  },
];
