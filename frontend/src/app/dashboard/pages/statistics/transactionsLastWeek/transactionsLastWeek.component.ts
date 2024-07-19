import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Chart, ChartModule } from 'angular-highcharts';
import { Stadistic } from '../interfaces/statistic.interface';
import { SeriesOptionsType } from 'highcharts';

@Component({
  selector: 'transactions-last-week',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './transactionsLastWeek.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsLastWeekComponent {
  public chart: Chart;
  @Input() transactions: Stadistic[]; // Asegúrate de ajustar el tipo de datos según lo que esperas recibir

  ngOnInit() {
    if (this.transactions) {
      const categories = this.transactions.map(
        (transaction) => transaction.tipo,
      );
      const data = this.transactions.map((transaction) => transaction.valor);

      const categoryColors: any = {
        'Info': '#0ca86b',
        'Error': '#ff3333',
        // Agrega más categorías según sea necesario
      };
      const seriesData = categories.map((category, index) => ({
        name: category,
        y: data[index],
        color: categoryColors[category] || '#ff751a', // Color predeterminado si no se encuentra en categoryColors
      }));

      this.chart = new Chart({
        chart: {
          type: 'pie',
        },
        title: {
          text: 'Última Semana',
        },
        xAxis: {
          categories: categories,
          title: {
            text: 'Tipo',
          },
        },
        yAxis: {
          title: {
            text: 'Valor',
          },
        },
        credits: {
          enabled: false,
        },
        colors: ['#0ca86b'],
        series: [
          {
            name: 'N° Transacciones',
            data: seriesData,
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}',
          },
          } as SeriesOptionsType,
        ],
      });
    }
  }
}
