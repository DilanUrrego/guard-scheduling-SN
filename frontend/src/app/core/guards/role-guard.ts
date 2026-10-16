import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];

  if (!roles.length || roles.includes(auth.currentUser()?.role ?? '')) return true;
  router.navigate(['/dashboard']);
  return false;
};