import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { MaterialModule } from '../../../angular-material/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Option {
  value: string | number;
  text: string;
}

export interface OptionGroup {
  value: string | number;
  optionList: Option[] | null;
}

@Component({
  selector: 'app-radio-button',
  templateUrl: './radio-buttons.component.html',
  styleUrls: ['./radio-buttons.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatRadioModule],
})
export class RadioButtonSelectorComponent {
  @Input() optionList: Option[] | null = []; // Lista de opciones dinámicas
  @Input() groupName = 'optionGroup'; // Nombre único para el grupo de radios
  @Output() optionSelected = new EventEmitter<{ value: string | number; groupName: string }>(); // Emitir el valor seleccionado

  private selectedValue: { value: string | number; groupName: string };

  onSelectionChange(value: any) {
    this.selectedValue = { value, groupName: this.groupName };
    this.optionSelected.emit(this.selectedValue);
  }
}
