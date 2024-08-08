import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { BasicTableComponent } from '../../../../../shared/components/basic-table/basic-table.component';
import { NewService } from '../new/new.component';
import { ProfesionalServiceService } from '../profesionalService.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, MaterialModule, BasicTableComponent],
  templateUrl: './service.component.html',
  styleUrl: './service.component.css',
})
export default class ServiceListComponent {
  public dialog = inject(MatDialog);
  private profesionalServiceService = inject(ProfesionalServiceService);
  public searchResults$: Observable<any>;

  tableColumns = ['code', 'description'];

  ngOnInit() {
    this.loadProfesionalServices();
  }

  loadProfesionalServices() {
    this.searchResults$ = this.profesionalServiceService.getProfesionalServices();
  }

  onAddService() {
    const dialogRef = this.dialog.open(NewService, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      console.log('cerrado');
      this.loadProfesionalServices();

      this.searchResults$.subscribe( response => {
        console.log(response);
        
      })
      
      if (result) {
        this.loadProfesionalServices();
        // this.searchResults$ = this.parameterService.getPermissions();

        // this.parameterService.getPermissions().subscribe((permissions) => {
        //   this.tableData = permissions;
        // });
      }
    });
    
  }
}
