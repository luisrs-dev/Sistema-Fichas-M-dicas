import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MaterialModule } from '../../../angular-material/material.module';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `<mat-spinner
    class="spinner"
    diameter="{{ diameter || 30 }}"
  ></mat-spinner>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input() diameter: string;
}
