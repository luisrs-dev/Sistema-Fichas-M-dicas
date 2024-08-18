import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { MedicalRecord } from '../../dashboard/interfaces/medicalRecord.interface';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generateClinicalRecordsPdf(clinicalRecords: MedicalRecord[]) {
    const doc = new jsPDF();

    let nombrePaciente = '';

    clinicalRecords.forEach((record, index) => {
      const patientName = `${record.patient.name} ${record.patient.surname} ${record.patient.secondSurname}`;
      nombrePaciente = patientName;
      // Agregar una página por cada ficha clínica después de la primera
      if (index !== 0) {
        doc.addPage();
      }

      // Título de la ficha clínica
      let y = 20; // Inicializa la posición y
      doc.setFontSize(18);
      doc.text('Ficha Clínica', 10, y);

      // Incrementa la posición y para la siguiente línea de texto
      y += 20;
      doc.setFontSize(12);
      doc.text(`Registrado por: ${record.registeredBy.name}`, 10, y);

      y += 10;
      doc.text(`Nombre del Paciente: ${patientName}`, 10, y);

      y += 10;
      doc.text(`Fecha de Ingreso: ${record.date}`, 10, y);

      y += 10;
      doc.text(`Tipo de atención: ${record.service.description} (${record.service.code})`, 10, y);

      y += 10;
      doc.text(`Tipo de entrada: ${record.entryType}`, 10, y);

      y += 10;
      doc.text(`Elementos Relevantes: ${record.relevantElements}`, 10, y);

      if(record.diagnostic){
        y += 10;
        doc.text(`Diagnóstico: ${record.diagnostic}`, 10, y);
      }

      if(record.pharmacologicalScheme){
        y += 10;
        doc.text(`Esquema farmacológico: ${record.pharmacologicalScheme}`, 10, y);
      }
    });

    // Descargar el PDF
    doc.save(`Historial clinico - ${nombrePaciente} .pdf`);
  }

}
