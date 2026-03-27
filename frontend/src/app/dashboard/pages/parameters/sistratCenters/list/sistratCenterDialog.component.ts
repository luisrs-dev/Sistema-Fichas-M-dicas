import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { SistratCenter, SistratCenterService } from '../../../../services/sistratCenter.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-sistrat-center-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Agregar' : 'Editar' }} Centro</h2>
    <mat-dialog-content>
      <form [formGroup]="centerForm" class="flex-col gap-4 mt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre del Centro</mat-label>
          <input matInput formControlName="name" placeholder="Ej: mujeres">
          <mat-hint>El nombre debe coincidir con el usado en Sistrat</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Usuario SISTRAT</mat-label>
          <input matInput formControlName="usuario">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Contraseña</mat-label>
          <input matInput [type]="hide ? 'password' : 'text'" formControlName="password">
          <button mat-icon-button matSuffix (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide">
            <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-hint *ngIf="data.mode === 'edit'">Dejar en blanco para no cambiar</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="active">Activo</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="centerForm.invalid" (click)="onSave()">
        {{ data.mode === 'add' ? 'Crear' : 'Actualizar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class SistratCenterDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sistratCenterService = inject(SistratCenterService);
  private dialogRef = inject(MatDialogRef<SistratCenterDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  public centerForm: FormGroup;
  public hide = true;

  ngOnInit(): void {
    this.centerForm = this.fb.group({
      name: [this.data.center?.name || '', [Validators.required]],
      usuario: [this.data.center?.usuario || '', [Validators.required]],
      password: ['', this.data.mode === 'add' ? [Validators.required] : []],
      active: [this.data.center?.active ?? true]
    });
  }

  onSave(): void {
    if (this.centerForm.invalid) return;

    const formValue = this.centerForm.value;
    if (this.data.mode === 'add') {
      this.sistratCenterService.createCenter(formValue).subscribe({
        next: () => {
          Notiflix.Notify.success('Centro creado correctamente');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          Notiflix.Notify.failure('Error al crear el centro');
          console.error(err);
        }
      });
    } else {
      const updateData: Partial<SistratCenter> = { ...formValue };
      if (!updateData.password) delete updateData.password;

      this.sistratCenterService.updateCenter(this.data.center._id, updateData).subscribe({
        next: () => {
          Notiflix.Notify.success('Centro actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          Notiflix.Notify.failure('Error al actualizar el centro');
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
