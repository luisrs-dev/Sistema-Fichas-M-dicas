import { TransactionsLastWeekComponent } from './transactionsLastWeek/transactionsLastWeek.component';
import { Transactions24HrsComponent } from './transactions24Hrs/transactions24Hrs.component';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  type OnInit,
} from '@angular/core';
import { MaterialModule } from '../../../angular-material/material.module';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Transaction } from '../../interfaces/transaction.interface';
import { BankTransactions } from './interfaces/bankTransactions.interface';
import { Stadistic } from './interfaces/statistic.interface';
import { TransactionsByBankComponent } from './transactionsByBank/transactionsByBank.component';
import { GraphComponent } from './components/graph/graph.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    SpinnerComponent,
    TransactionsByBankComponent,
    Transactions24HrsComponent,
    TransactionsLastWeekComponent,
    GraphComponent
  ],
  templateUrl: './statistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StatisticsComponent implements OnInit {
  public loadingStadistics: boolean;
  public lastWeekCounts: Stadistic[];

  public last24HoursCounts: Stadistic[];
  public transactionsByBank: any;
  public transactions: Transaction[];


  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadingStadistics = true;

      this.changeDetectorRef.detectChanges();
  }

}
