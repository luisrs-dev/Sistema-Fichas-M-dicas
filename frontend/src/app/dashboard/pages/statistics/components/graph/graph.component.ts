import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Chart, ChartModule } from 'angular-highcharts';
import { SeriesOptionsType } from 'highcharts';


@Component({
    selector: 'graph',
    standalone: true,
    imports: [
        CommonModule, ChartModule
    ],
    templateUrl: './graph.component.html',
    styleUrl: './graph.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphComponent {

    @Input() chartTitle: string;
    @Input() categories: string[];
    @Input() data: number[];
    @Input() chartType: string;
  
    public chart: Chart;
  
    ngOnInit() {
      if (this.categories && this.data && this.chartType) {
        this.chart = new Chart({
          chart: {
            type: this.chartType,
          },
          title: {
            text: this.chartTitle,
          },
          xAxis: {
            categories: this.categories,
            title: {
              text: 'X Axis Title',
            },
          },
          yAxis: {
            title: {
              text: 'Y Axis Title',
            },
          },
          credits: {
            enabled: false,
          },
          series: [
            {
              name: 'Data',
              data: this.data,
            } as SeriesOptionsType,
          ],
        });
      }
    }
 }
