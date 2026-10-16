import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  // Ruta raíz → redirige según estado de sesión
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Autenticación (pública)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routes').then(m => m.AUTH_ROUTES),
  },

  // App principal (requiere JWT)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'scheduling',
        loadComponent: () => import('./scheduling/calendar/calendar').then(m => m.CalendarComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'coordinator'] },
      },
      {
        path: 'guards',
        loadComponent: () => import('./administration/guards/guards-list').then(m => m.GuardsListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'coordinator'] },
      },
      {
        path: 'clients',
        loadComponent: () => import('./administration/clients/clients-list').then(m => m.ClientsListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'posts',
        loadComponent: () => import('./administration/posts/posts-list').then(m => m.PostsListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'coordinator'] },
      },
      {
        path: 'shift-configs',
        loadComponent: () => import('./administration/shift-configs/shift-configs-list').then(m => m.ShiftConfigsListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'novelties',
        loadComponent: () => import('./novelties/novelties-list').then(m => m.NoveltiesListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'coordinator'] },
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'coordinator'] },
      },
      {
        path: 'users',
        loadComponent: () => import('./administration/users/users-list').then(m => m.UsersListComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

