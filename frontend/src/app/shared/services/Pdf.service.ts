import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { MedicalRecord } from '../../dashboard/interfaces/medicalRecord.interface';

interface ImageRecord {
  imgData: HTMLImageElement;
  record: MedicalRecord;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private backendUrl = 'http://localhost:3002'; // Cambia esto a la URL de tu backend

  async generateClinicalRecordsPdf(clinicalRecords: MedicalRecord[]) {
    const doc = new jsPDF();
    let nombrePaciente = '';

    console.log({ clinicalRecords });

    // Cargar imágenes de forma asíncrona
    const imagePromises: Promise<ImageRecord | null>[] = clinicalRecords.map(
      (record) => {
        return new Promise((resolve) => {
          const img = new Image();
          if (record.registeredBy.signature) {
            img.src = `${this.backendUrl}${record.registeredBy.signature}`; // URL completa de la imagen

            img.onload = () => {
              resolve({ imgData: img, record }); // Resuelve la promesa con la imagen y el registro
            };
          } else {
            resolve(null); // Si no hay firma, resuelve null
          }
        });
      }
    );

    const images = await Promise.all(imagePromises);

    clinicalRecords.forEach((record, index) => {
      const patientName = `${record.patient.name} ${record.patient.surname} ${record.patient.secondSurname}`;
      nombrePaciente = patientName;

      // Mueve a una nueva página si es la tercera ficha (cada página contiene dos)
      if (index % 2 === 0 && index !== 0) {
        doc.addPage();
      }

      // Calcula la posición Y inicial dependiendo de si es la primera o segunda ficha en la página
      let y = index % 2 === 0 ? 20 : 150;

      // Encabezado
      this.addHeader(doc, `Ficha Clínica de ${patientName}`, y);
      y += 20; // Incrementa para dejar espacio bajo el encabezado

      // Tabla de información del paciente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Información del paciente en formato de tabla
      const tableColumnWidth = 50;
      const tableStartX = 10;
      let tableStartY = y + 10;

      // Definir la estructura de la tabla
      const patientData = [
        ['Registrado por:', record.registeredBy.name],
        ['Fecha de Ingreso:', record.date],
        [
          'Tipo de atención:',
          `${record.service.description} (${record.service.code})`,
        ],
        ['Tipo de entrada:', record.entryType],
        ['Elementos Relevantes:', record.relevantElements],
        ['Diagnóstico:', record.diagnostic || 'N/A'],
        ['Esquema farmacológico:', record.pharmacologicalScheme || 'N/A'],
      ];

      // Dibujar la tabla
      patientData.forEach((row, rowIndex) => {
        const cellY = tableStartY + rowIndex * 10;
        doc.text(row[0], tableStartX, cellY);
        doc.text(row[1], tableStartX + tableColumnWidth, cellY);
      });

      // Línea para la firma del profesional
      y = tableStartY + patientData.length * 10 + 10;
      doc.line(10, y, 80, y); // Dibujar línea horizontal para la firma
      doc.text('Firma del Profesional', 10, y + 5);

      // Agregar la imagen de la firma si existe
      const image = images[index];
      if (image) {
        const imgData = image.imgData; // La imagen cargada
        doc.addImage(imgData.src, 'PNG', 10, y - 20, 50, 20); // Ajusta la posición y el tamaño según sea necesario
      }

      // Pie de página solo si es la segunda ficha en la página o la última ficha
      if (index % 2 !== 0 || index === clinicalRecords.length - 1) {
        this.addFooter(doc);
      }
    });

    // Descargar el PDF
    doc.save(`Historial clinico - ${nombrePaciente}.pdf`);
  }

  addHeader(doc: jsPDF, title: string, y: number) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Centro de Salud Ficlin', 10, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, y);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 10, y + 20);
    doc.line(10, y + 25, 200, y + 25); // Línea horizontal debajo del título
  }

  addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    const currentPage = doc.getNumberOfPages();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${currentPage}`, 180, pageHeight - 10); // Posición de la página en el pie de página
  }
}
