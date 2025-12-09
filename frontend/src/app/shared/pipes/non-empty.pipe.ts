import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nonEmpty',
  standalone: true,
})
export class NonEmptyPipe implements PipeTransform {
  transform(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value)
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > 0 ? text : null;
  }
}
