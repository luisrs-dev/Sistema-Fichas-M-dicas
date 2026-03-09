import { Types } from "mongoose";

export interface SystemStatus {
  action?: "open" | "close";
  isOpen: boolean;
  note?: string;
  updatedByName?: string;
  updatedByUserId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}