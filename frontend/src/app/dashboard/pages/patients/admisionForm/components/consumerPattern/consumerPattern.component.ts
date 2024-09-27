import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBaseComponent } from '../form-base.component';

@Component({
  selector: 'consumer-pattern-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consumerPattern.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumerPatternComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);

  ngOnInit(){
    this.form = this.fb.group({
      selsustancia_princial: ['', [Validators.required]],
      selotra_sustancia_1: ['', [Validators.required]],
      selotra_sustancia_2: ['', [Validators.required]],
      selotra_sustancia_3: ['', [Validators.required]],
      selfrecuencia_consumo: ['', Validators.required],
      txtedad_inicio_consumo: ['', Validators.required],
      selvia_administracion: ['', Validators.required],
      selsustancia_inicio: ['', Validators.required],
      txtedad_inicio_consumo_inicial: ['', Validators.required]
    });

  }
}
