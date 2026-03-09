import { DateAdapter, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';

export class MondayFirstNativeDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }
}

export const MONDAY_FIRST_DATE_PROVIDERS = [
  provideNativeDateAdapter(),
  { provide: DateAdapter, useClass: MondayFirstNativeDateAdapter },
];