import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Chart, ChartModule } from 'angular-highcharts';
import { SeriesOptionsType } from 'highcharts';
import { BankTransactions } from '../interfaces/bankTransactions.interface';

@Component({
  selector: 'transactions-by-bank',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './transactionsByBank.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsByBankComponent {
  public chart: Chart;

  @Input() transactionsByBank: BankTransactions[]; // Asegúrate de ajustar el tipo de datos según lo que esperas recibir

  ngOnInit() {
    if (this.transactionsByBank) {
      const categories = this.transactionsByBank.map(
        (transaction) => transaction.bank,
      );
      const data = this.transactionsByBank.map(
        (transaction) => transaction.transactions,
      );
      this.chart = new Chart({
        chart: {
          type: 'column',
        },
        title: {
          text: 'N° Transacciones por Banco',
        },
        xAxis: {
          categories: categories,
          title: {
            text: 'Banco',
          },
        },
        yAxis: {
          title: {
            text: 'Transacciones',
          },
        },
        credits: {
          enabled: false,
        },
        colors: ['#0ca86b'],
        series: [
          {
            name: 'N° Transacciones',
            data: data,
          } as SeriesOptionsType,
        ],
      });
    }
  }
}
