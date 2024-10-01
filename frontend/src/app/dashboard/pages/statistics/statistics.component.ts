import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, type OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';
import { MedicalRecordService } from './../medicalRecord/medicalRecord.service';
import { ProfesionalServiceService, Service } from './../parameters/services/profesionalService.service';
import { GraphComponent } from './components/graph/graph.component';
import { Transactions24HrsComponent } from './transactions24Hrs/transactions24Hrs.component';
import { TransactionsByBankComponent } from './transactionsByBank/transactionsByBank.component';
import { TransactionsLastWeekComponent } from './transactionsLastWeek/transactionsLastWeek.component';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../angular-material/material.module';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    TransactionsByBankComponent,
    Transactions24HrsComponent,
    TransactionsLastWeekComponent,
    GraphComponent,
    MatExpansionModule,
    MaterialModule,
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StatisticsComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private profesionalServiceService = inject(ProfesionalServiceService);

  private cdRef = inject(ChangeDetectorRef);

  public selectedMonth: number;
  public selectedYear: number;

  public medicalRecords: MedicalRecord[] = [];
  public services: Service[] = [];

  public groupedRecords: { [key: string]: { serviceDescription: string; records: any[] }[] } = {};

  public daysInMonth: string[] = [];
  public displayedColumns: string[] = [];
  public patientNames: string[] = [];

  dataSource: MatTableDataSource<any>; // Reemplaza con el tipo correcto para los datos

  ngOnInit() {
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1;

    this.getServices();

    this.calculateDaysInMonth(this.selectedMonth, this.selectedYear);

    this.cdRef.detectChanges();
  }

  getServices() {
    this.profesionalServiceService.getProfesionalServices().subscribe((services) => {
      this.services = services;
      console.log({ services });
      this.getMedicalRecords(this.selectedMonth, this.selectedYear);
    });
  }

  getMedicalRecords(month: number, year: number) {
    this.medicalRecordService.getMedialRecordsByMonthAndYear(9, year).subscribe((response) => {
      this.medicalRecords = response.medicalRecords;
      console.log({ medicalRecords: this.medicalRecords });
      this.groupClinicalRecords();
      this.getPatientNames();

      this.cdRef.detectChanges();
    });
  }

  calculateDaysInMonth(month: number, year: number) {
    const days = new Date(year, month, 0).getDate(); // Último día del mes
    this.daysInMonth = Array.from({ length: days }, (v, k) => (k + 1).toString()); // Array de 1 a 30/31
    this.displayedColumns = this.daysInMonth.map((day) => day.toString()); // Convertir días a strings para las columnas
    this.displayedColumns = ['patientName', ...this.displayedColumns];
  }

  groupClinicalRecords() {
    // Creamos un array vacío para almacenar los pacientes con sus servicios y registros
    const groupedRecordsArray: any = [];

    this.medicalRecords.forEach((record) => {
      const patientName = record.registeredBy.name;
      const serviceDescription = record.service.description;

      // Buscamos si ya existe un objeto para este paciente en groupedRecordsArray
      let existingPatientGroup = groupedRecordsArray.find((patient: any) => patient.name === patientName);

      if (!existingPatientGroup) {
        // Si el paciente no existe, lo creamos con un array vacío para los servicios
        existingPatientGroup = {
          name: patientName,
          services: [],
        };
        groupedRecordsArray.push(existingPatientGroup);
      }

      // Buscamos si ya existe un grupo de servicios para este paciente
      let existingServiceGroup = existingPatientGroup.services.find((service: any) => service.serviceDescription === serviceDescription);

      if (existingServiceGroup) {
        // Si ya existe el servicio, simplemente agregamos el registro
        existingServiceGroup.records.push(record);
      } else {
        // Si no existe el servicio, lo creamos con su primer registro
        existingPatientGroup.services.push({
          serviceDescription: serviceDescription,
          records: [record],
        });
      }
    });

    // Guardamos el resultado en groupedRecordsArray
    this.groupedRecords = groupedRecordsArray;
  }

  getPatientNames() {
    this.patientNames = Array.from(new Set(this.medicalRecords.map((mr) => mr.registeredBy.name)));
    this.dataSource = new MatTableDataSource(this.patientNames);
    console.log(this.patientNames);
  }

  getDayRecord(name: string, day: string): number {
    const isRecorded = this.medicalRecords.find((record) => {
      const registeredByName = record.registeredBy?.name;
      // Extraemos el día de la propiedad date
      const recordDay = new Date(record.date).getUTCDate().toString(); // Convertimos a string para comparar con 'day'
      return registeredByName === name && recordDay === day;
    });
    return isRecorded ? 1 : 0;
  }
}
