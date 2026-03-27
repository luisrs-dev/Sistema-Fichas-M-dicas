import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { SistratCenter, SistratCenterService } from '../../../../services/sistratCenter.service';
import { SistratCenterDialogComponent } from './sistratCenterDialog.component';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-sistrat-centers',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './sistratCenters.component.html',
  styleUrl: './sistratCenters.component.css',
})
export default class SistratCentersComponent implements OnInit {
  private sistratCenterService = inject(SistratCenterService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  public centers: SistratCenter[] = [];
  public displayedColumns: string[] = ['name', 'usuario', 'active', 'actions'];

  ngOnInit(): void {
    this.loadCenters();
  }

  loadCenters(): void {
    this.sistratCenterService.getCenters().subscribe({
      next: (centers) => {
        this.centers = centers;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        Notiflix.Notify.failure('Error al cargar los centros');
        console.error(err);
      }
    });
  }

  onAddCenter(): void {
    const dialogRef = this.dialog.open(SistratCenterDialogComponent, {
      width: '400px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCenters();
      }
    });
  }

  onEditCenter(center: SistratCenter): void {
    const dialogRef = this.dialog.open(SistratCenterDialogComponent, {
      width: '400px',
      data: { mode: 'edit', center }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCenters();
      }
    });
  }

  onDeleteCenter(center: SistratCenter): void {
    Notiflix.Confirm.show(
      'Eliminar Centro',
      `¿Estás seguro de que deseas eliminar el centro "${center.name}"?`,
      'Eliminar',
      'Cancelar',
      () => {
        if (!center._id) return;
        this.sistratCenterService.deleteCenter(center._id).subscribe({
          next: () => {
            Notiflix.Notify.success('Centro eliminado correctamente');
            this.loadCenters();
          },
          error: (err: any) => {
            Notiflix.Notify.failure('Error al eliminar el centro');
            console.error(err);
          }
        });
      }
    );
  }
}
