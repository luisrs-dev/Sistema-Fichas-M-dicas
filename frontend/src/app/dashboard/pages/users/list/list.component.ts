import { UserService } from './../user.service';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  inject,
  type OnInit,
} from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { AuthService } from '../../../../auth/auth.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListComponent implements OnInit {
  displayedColumns: string[] = ['active', 'name', 'email', 'profile', 'signature', 'permissions', 'programs', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  public users: User[];
  public isAdmin: boolean;
  public togglingActive: Record<string, boolean> = {};
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.userService.getUsers().subscribe(users => {
      this.users = this.sortUsers(users ?? []);

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.users;

      this.paginator.pageSize = 10; // Define el número de elementos por página
      this.cdr.markForCheck();
    })
  }

  onToggleActive(user: User, isActive: boolean): void {
    if (!user._id) {
      return;
    }

    const previousValue = user.active !== false;
    this.togglingActive[user._id] = true;
    user.active = isActive;
    this.refreshSortedDataSource();
    this.cdr.markForCheck();

    this.userService.updateActiveStatus(user._id, isActive).subscribe({
      next: () => {
        this.togglingActive[user._id!] = false;
        this.refreshSortedDataSource();
        this.cdr.markForCheck();
      },
      error: () => {
        user.active = previousValue;
        this.togglingActive[user._id!] = false;
        this.refreshSortedDataSource();
        this.cdr.markForCheck();
        Notiflix.Report.failure('Error', 'No se pudo actualizar el estado del usuario', 'Entendido');
      },
    });
  }

  private sortUsers(users: User[]): User[] {
    return [...users].sort((a, b) => {
      const aWeight = a.active === false ? 1 : 0;
      const bWeight = b.active === false ? 1 : 0;
      if (aWeight !== bWeight) return aWeight - bWeight;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private refreshSortedDataSource(): void {
    this.users = this.sortUsers(this.dataSource.data);
    this.dataSource.data = this.users;
  }

  editPatient(patientId: string) {
    this.router.navigate([`dashboard/users/nuevo/${patientId}`]);
  }
}
