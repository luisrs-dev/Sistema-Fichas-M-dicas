import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  type OnInit,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../angular-material/material.module';
import { routes } from '../app.routes';
import { AuthService } from './../auth/auth.service';
import { MobileService } from './../shared/services/mobile.service';

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

  public authService = inject(AuthService);
  private observer = inject(BreakpointObserver);
  private mobileService = inject(MobileService);

  ngOnInit() {
    this.observer.observe(['(max-width: 800px)']).subscribe((screenSize) => {
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
    .map((route) => {
      return {
        path: route.path,
        title: route.title,
        icon: route.data?.['icon'],
      };
    });
}
