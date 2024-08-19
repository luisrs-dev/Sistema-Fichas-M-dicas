import { UserService } from './../user.service';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
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

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListComponent implements OnInit {
  displayedColumns: string[] = [ 'name', 'email', 'profile','permissions','programs', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  public users: User[];
  public isAdmin: boolean;
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.userService.getUsers().subscribe( users => {
      this.users = users;

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.users;

      this.paginator.pageSize = 10; // Define el número de elementos por página
    })
  }

  editPatient(patientId: string) {
    this.router.navigate([`dashboard/users/nuevo/${patientId}`]);
  }
}
