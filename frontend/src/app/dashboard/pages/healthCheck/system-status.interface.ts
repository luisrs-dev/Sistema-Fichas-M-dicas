export interface SystemStatus {
  _id?: string;
  action?: 'open' | 'close';
  isOpen: boolean;
  note?: string;
  updatedByName?: string;
  updatedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}