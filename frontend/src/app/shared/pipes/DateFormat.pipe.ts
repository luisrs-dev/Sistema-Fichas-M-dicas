import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string): string {
    // Formatea la fecha al formato 'dd/MM/yyyy'
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    // console.log(`Fecha:::: ${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  }
}
