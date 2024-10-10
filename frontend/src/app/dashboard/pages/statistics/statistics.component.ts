import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../angular-material/material.module';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { MedicalRecord } from './../../interfaces/medicalRecord.interface';
import { MedicalRecordService } from './../medicalRecord/medicalRecord.service';
import { ProfesionalServiceService, Service } from './../parameters/services/profesionalService.service';
import { GraphComponent } from './components/graph/graph.component';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    GraphComponent,
    MatExpansionModule,
    MaterialModule,
    FormsModule,
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
  public months: { value: number, viewValue: string }[] = [];


  public years: number[] = [];

  dataSource: MatTableDataSource<any>; // Reemplaza con el tipo correcto para los datos

  constructor() {
    // Generar los últimos 10 años dinámicamente
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {

    this.months = [
      { value: 1, viewValue: 'Enero' },
      { value: 2, viewValue: 'Febrero' },
      { value: 3, viewValue: 'Marzo' },
      { value: 4, viewValue: 'Abril' },
      { value: 5, viewValue: 'Mayo' },
      { value: 6, viewValue: 'Junio' },
      { value: 7, viewValue: 'Julio' },
      { value: 8, viewValue: 'Agosto' },
      { value: 9, viewValue: 'Septiembre' },
      { value: 10, viewValue: 'Octubre' },
      { value: 11, viewValue: 'Noviembre' },
      { value: 12, viewValue: 'Diciembre' },
    ];

    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1;
    
    this.getServices();
    this.getMedicalRecords();
    //this.getMedicalRecords(this.selectedMonth, this.selectedYear);

    this.calculateDaysInMonth(this.selectedMonth, this.selectedYear);

    this.cdRef.detectChanges();
  }

  getServices() {
    this.profesionalServiceService.getProfesionalServices().subscribe((services) => {
      this.services = services;
    });
  }

  getMedicalRecords() {
    console.log(this.selectedMonth);
    console.log(this.selectedYear);
    
    this.medicalRecordService.getMedialRecordsByMonthAndYear(this.selectedMonth, this.selectedYear).subscribe((response) => {
      this.medicalRecords = response.medicalRecords;
      
      this.groupClinicalRecords();
      this.getPatientNames();
      this.cdRef.detectChanges();
    });
  }

  onSearchMedicalRecords(){
    console.log('buscando');
    
    this.getMedicalRecords();

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
  }

  getDayRecord(servie: Service, name: string, day: string): { records: number; patients: string } {
    const records = this.medicalRecords.filter((record) => {
      const registeredByName = record.registeredBy?.name;
      // Extraemos el día de la propiedad date
      const recordDay = new Date(record.date).getUTCDate().toString(); // Convertimos a string para comparar con 'day'
      return record.service._id == servie._id && registeredByName === name && recordDay === day;
    });

    let patients = '';
    if (records.length > 0) {
      patients = records.map((record) => record.patient?.name).join('');
    }

    return { records: records.length, patients };
  }

  onMonthChange(event: MatSelectChange) {
    this.selectedMonth = event.value;
  }
}
