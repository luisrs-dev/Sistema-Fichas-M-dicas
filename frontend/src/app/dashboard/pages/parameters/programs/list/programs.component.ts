import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { BasicTableComponent } from '../../../../../shared/components/basic-table/basic-table.component';
import { ParametersService } from '../../parameters.service';
import { NewProgram } from '../new/new.component';
import { Parameter, ParameterValue } from '../../interfaces/parameter.interface';

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
  private changeDetectorRef = inject(ChangeDetectorRef);

  public searchResults$: Observable<any>;
  public listPrograms: Parameter[];

  tableColumns = ['name', 'value'];

  ngOnInit() {
    
    this.parameterService.programs.subscribe( programs => {
      if(programs){
        console.log('{programs} en ngoninit');
        console.log({programs});
        
        this.listPrograms = programs
      }
    })
    this.loadPrograms();

  }

  loadPrograms() {
    this.parameterService.getParameters(ParameterValue.Program).subscribe( newPrograms => {
      console.log({newPrograms});
      this.listPrograms = newPrograms;
          this.changeDetectorRef.detectChanges(); // Forzar la detección de cambios

    })
  }
  
  onAddProgram() {
    const dialogRef = this.dialog.open(NewProgram, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(result){
        console.log('afertclosed');
        
        this.loadPrograms();
      }
    });
    
  }
}
