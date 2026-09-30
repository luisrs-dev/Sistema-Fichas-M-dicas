import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  signal,
  DestroyRef,
  type OnInit,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialModule } from '../angular-material/material.module';
import { routes } from '../app.routes';
import { AuthService } from './../auth/auth.service';
import { MobileService } from './../shared/services/mobile.service';
import { User } from '../auth/interfaces/login-response.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  styleUrl: 'dashboard.component.css',
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent implements OnInit {
  @ViewChild(MatSidenav)
  public sidenav!: MatSidenav;
  public isMobile: boolean = true;
  public openGroup = signal<string | null>(null);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  toggleGroup(group: string) {
    this.openGroup.update(current => current === group ? null : group);
  }

  private revealCurrentGroup() {
    const path = this.router.url.split('?')[0];
    const group = this.menuParameters.some(item => path.startsWith('/dashboard/' + item.path)) ? 'parameters' : null;
    this.openGroup.set(group);
  }

  closeMobileMenu() {
    if (this.isMobile) void this.sidenav.close();
  }
  public bulkMenuItems = [
    { path: '/dashboard/registro-masivo/atenciones', title: 'Atenciones', icon: 'event_note' },
    { path: '/dashboard/registro-masivo/alertas', title: 'Alertas', icon: 'notifications' },
    { path: '/dashboard/registro-masivo/historicos', title: 'Históricos', icon: 'history' },
  ];
  public patientMenuItems = [
    { path: '/dashboard/patients/lista-espera', title: 'Lista de espera', icon: 'pending_actions' },
    { path: '/dashboard/patients/activos', title: 'Pacientes activos', icon: 'people' },
    { path: '/dashboard/patients/historicos', title: 'Pacientes históricos', icon: 'history' },
  ];

  public authService = inject(AuthService);
  private observer = inject(BreakpointObserver);
  private mobileService = inject(MobileService);
  public isAdmin: boolean;
  public user: User;

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.user = this.authService.getUser();
    this.revealCurrentGroup();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) this.revealCurrentGroup();
    });
    
    
    this.observer.observe(['(max-width: 800px)']).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((screenSize) => {
      this.mobileService.setMobileState(screenSize.matches);
      this.isMobile = screenSize.matches;
    });
  }

  onLogout() {
    this.authService.logout();
  }

  toggleMenu() {
    if (this.isMobile) {
      this.sidenav.toggle();
    } else {
      this.sidenav.toggle();
    }
  }

  public menuItems = routes
    .map((route) => route.children ?? [])
    .flat()
    .filter((route) => route && route.path)
    .filter((route) => !route.path?.includes(':'))
    .filter((route) => route.data && !route.data['child'])
    .filter((route) => route.data && !route.data['parameter'])
    .map((route) => {
      return {
        path: route.path,
        title: route.title,
        icon: route.data?.['icon'],
        forAdmin: route.data?.['forAdmin'] || false,
      };
    });
    
    
    public menuParameters = routes
    .map((route) => route.children ?? [])
    .flat()
    .filter((route) => route && route.data  )
    .filter((route) => route.data && route.data?.['parameter'])
    .map((route) => {
      return {
        path: route.path,
        title: route.title,
        icon: route.data?.['icon'],
      };
    });

}
