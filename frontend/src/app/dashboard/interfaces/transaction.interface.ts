export interface Transaction {
  idlogtransaccion: number;
  transaccion: string;
  banco: string;
  tipo: string;
  modulo: string;
  mensaje: string;
  content: string;
  msg: null;
  img: string;
  fecha_alta: Date;
}

export interface Module {
  modulo: string;
}

export interface TransactionFilter {
  modulo?: string;
  tipoValue?: string;
  idTransaccion?: string;
  startDate?: string;
  endDate?: string;
}


export interface ResponseTransactions{
  transactions: Transaction[],
  filters: any;
}