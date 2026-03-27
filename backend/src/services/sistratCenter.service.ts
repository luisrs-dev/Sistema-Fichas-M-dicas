import SistratCenterModel from "../models/sistratCenter.model";
import { SistratCenter } from "../interfaces/sistratCenter.interface";

export const createCenter = async (center: SistratCenter) => {
  const newCenter = new SistratCenterModel(center);
  return await newCenter.save();
};

export const getCenters = async () => {
  return await SistratCenterModel.find();
};

export const getActiveCenters = async () => {
  return await SistratCenterModel.find({ active: true });
};

export const getCenterByName = async (name: string) => {
  return await SistratCenterModel.findOne({ name });
};

export const updateCenter = async (id: string, center: Partial<SistratCenter>) => {
  return await SistratCenterModel.findByIdAndUpdate(id, center, { new: true });
};

export const deleteCenter = async (id: string) => {
  return await SistratCenterModel.findByIdAndDelete(id);
};
