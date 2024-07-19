import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';

export const isAuthenticatedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  authService.autoAuthUser();
  if (authService.getIsAuthenticated()) {
    return authService.getIsAuthenticated();
  }

  router.navigateByUrl('/login');
  return false;
};
