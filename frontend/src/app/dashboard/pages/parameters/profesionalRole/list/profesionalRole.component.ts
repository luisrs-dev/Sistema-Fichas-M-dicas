import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { NewProfesionalRole } from '../new/new.component';
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

  displayedColumns: string[] = ['name', 'services', 'actions'];
  dataSource = [];
  ngOnInit() {
    this.loadProfesionalRoles();
  }

  loadProfesionalRoles() {
    this.searchResults$ =  this.profesionalRoleService.getProfesionalRoles();
    
  }

  onEditProfesionalRole(id: string){
    console.log('editing', id);
    const dialogRef = this.dialog.open(NewProfesionalRole, {
      width: '40%',
      data: {id}
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadProfesionalRoles();

      this.searchResults$.subscribe( response => {
        console.log(response);
      })
      
      if (result) {
        this.loadProfesionalRoles();
      }
    });
    
  }
  
  onProfesionalRole() {
    const dialogRef = this.dialog.open(NewProfesionalRole, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadProfesionalRoles();

      this.searchResults$.subscribe( response => {
        console.log(response);
      })
      
      if (result) {
        this.loadProfesionalRoles();
      }
    });
    
  }
}
