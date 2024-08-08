import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { BasicTableComponent } from '../../../../../shared/components/basic-table/basic-table.component';
import { ParametersService } from '../../parameters.service';
import { NewProgram } from '../new/new.component';
import { ParameterValue } from '../../interfaces/parameter.interface';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, MaterialModule, BasicTableComponent],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.css',
})
export default class ProgramsComponent {
  public dialog = inject(MatDialog);
  private parameterService = inject(ParametersService);
  public searchResults$: Observable<any>;

  tableColumns = ['name', 'value'];

  ngOnInit() {
    this.loadPrograms();
  }

  loadPrograms() {
    this.searchResults$ = this.parameterService.getParameters(ParameterValue.Program);
  }
  
  onAddProgram() {
    const dialogRef = this.dialog.open(NewProgram, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadPrograms();

      this.searchResults$.subscribe( response => {
        console.log(response);
        
      })
      
      if (result) {
        this.loadPrograms();
        // this.searchResults$ = this.parameterService.getPermissions();

        // this.parameterService.getPermissions().subscribe((permissions) => {
        //   this.tableData = permissions;
        // });
      }
    });
    
  }
}
