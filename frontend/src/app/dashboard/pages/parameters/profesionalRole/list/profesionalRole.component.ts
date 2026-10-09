import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { NewProfesionalRole } from '../new/new.component';
import { ALERT_OPTIONS, defaultRoleAlerts } from '../../../../utils/alert-visibility';
import { ProfesionalRoleService } from '../profesionalRole.service';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatTableModule],
  templateUrl: './profesionalRole.component.html',
  styleUrl: './profesionalRole.component.css',
})
export default class profesionalRoleComponent {
  public dialog = inject(MatDialog);
  private profesionalRoleService = inject(ProfesionalRoleService);
  public searchResults$: Observable<any>;

  public profesionalRoles: any[] = [];

  displayedColumns: string[] = ['name', 'services', 'visibleAlerts', 'actions'];
  dataSource = [];
  ngOnInit() {
    this.loadProfesionalRoles();
  }

  alertLabels(role: { name: string; visibleAlerts?: string[] }): string[] {
    const alerts = role.visibleAlerts ?? defaultRoleAlerts(role.name);
    return ALERT_OPTIONS.filter(alert => alerts.includes(alert.value)).map(alert => alert.label);
  }

  loadProfesionalRoles() {
    this.searchResults$ =  this.profesionalRoleService.getProfesionalRoles();
    
  }

  onEditProfesionalRole(id: string, section: 'services' | 'alerts') {
    const dialogRef = this.dialog.open(NewProfesionalRole, {
      width: '640px',
      maxWidth: '95vw',
      data: { id, section }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProfesionalRoles();
    });
  }

  onProfesionalRole() {
    const dialogRef = this.dialog.open(NewProfesionalRole, {
      width: '640px',
      maxWidth: '95vw',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProfesionalRoles();
    });
  }
}
