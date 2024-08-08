import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BasicTableComponent } from '../../../../../shared/components/basic-table/basic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { NewPermission } from '../new/new.component';
import { Observable } from 'rxjs';
import { ParametersService } from '../../parameters.service';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { ParameterValue } from '../../interfaces/parameter.interface';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, MaterialModule, BasicTableComponent],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css',
})
export default class PermissionsComponent {
  public dialog = inject(MatDialog);
  private parameterService = inject(ParametersService);
  public searchResults$: Observable<any>;

  tableColumns = ['name', 'value'];

  ngOnInit() {
    this.loadPermissions();
  }

  loadPermissions() {
    this.searchResults$ = this.parameterService.getParameters(ParameterValue.Permission);
  }

  onAddPermission() {
    const dialogRef = this.dialog.open(NewPermission, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      console.log('cerrado');
      this.loadPermissions();

      this.searchResults$.subscribe( response => {
        console.log(response);
        
      })
      
      if (result) {
        this.loadPermissions();
        // this.searchResults$ = this.parameterService.getPermissions();

        // this.parameterService.getPermissions().subscribe((permissions) => {
        //   this.tableData = permissions;
        // });
      }
    });
    
  }
}
