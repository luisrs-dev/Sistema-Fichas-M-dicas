import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, model, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { ParameterValue } from '../../interfaces/parameter.interface';
import { ParametersService } from '../../parameters.service';
import { ProfesionalServiceService } from '../../services/profesionalService.service';
import { Service } from '../../services/interface/service.interface';

export interface Fruit {
  name: string;
}


@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewProfesionalRole {
  private parametersService = inject(ParametersService);
  private profesionalServiceService = inject(ProfesionalServiceService);
  private fb = inject(FormBuilder);
  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialogRef = inject(MatDialogRef<NewProfesionalRole>);
  public services: Service[];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentFruit = model('');
  readonly fruits = signal(['']);
  public allFruits: string[] = [
    "Consulta de salud mental",
    "Intervención psicosocial de grupo",
    "Visita domiciliaria",
    "Consulta médica",
    "Consulta Psicológica",
    "Psicoterapia Individual",
    "Psicoterapia Individual Grupal",
    "Psicodiagnostico",
    "Consulta Psiquiatrica"];
  readonly filteredFruits = computed(() => {
    const currentFruit = this.currentFruit().toLowerCase();
    return currentFruit
      ? this.allFruits.filter(fruit => fruit.toLowerCase().includes(currentFruit))
      : this.allFruits.slice();
  });

  readonly announcer = inject(LiveAnnouncer);



  ngOnInit(){
    this.profesionalServiceService.getProfesionalServices().subscribe( services => {
      console.log({services});
      this.services = services;
      this.allFruits = services.map(s => s.description);
      console.log(this.allFruits);

      this.changeDetectorRef.detectChanges();

      
      
    })
  }
  
  public programForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    services: this.fb.array([], [Validators.required])
  });

  onSave() {
    if (this.programForm.valid) {
      this.parametersService
        .addParameter(ParameterValue.Program, this.programForm.value)
        .subscribe((response) => {
          console.log(response);
          this.dialogRef.close(response); 
        });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }


  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.fruits.update(fruits => [...fruits, value]);
    }

    // Clear the input value
    this.currentFruit.set('');
  }

  remove(fruit: string): void {
    this.fruits.update(fruits => {
      const index = fruits.indexOf(fruit);
      if (index < 0) {
        return fruits;
      }

      fruits.splice(index, 1);
      this.announcer.announce(`Removed ${fruit}`);
      return [...fruits];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.fruits.update(fruits => [...fruits, event.option.viewValue]);
    this.currentFruit.set('');
    event.option.deselect();
  }

}
