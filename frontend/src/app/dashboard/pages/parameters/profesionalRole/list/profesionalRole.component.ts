import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { BasicTableComponent } from '../../../../../shared/components/basic-table/basic-table.component';
import { ParameterValue } from '../../interfaces/parameter.interface';
import { ParametersService } from '../../parameters.service';
import { NewProfesionalRole } from '../new/new.component';
import { ProfesionalRoleService } from '../profesionalRole.service';
import { MatTableModule } from '@angular/material/table';

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

  displayedColumns: string[] = ['name', 'services'];
  dataSource = ['csm','oro'];
  ngOnInit() {
    this.loadProfesionalRoles();
  }

  loadProfesionalRoles() {
    this.profesionalRoleService.getProfesionalRoles().subscribe( profesionalRoles => {
      console.log({profesionalRoles});
      this.dataSource = profesionalRoles;
      
    })
    
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
        // this.searchResults$ = this.parameterService.getPermissions();

        // this.parameterService.getPermissions().subscribe((permissions) => {
        //   this.tableData = permissions;
        // });
      }
    });
    
  }
}
