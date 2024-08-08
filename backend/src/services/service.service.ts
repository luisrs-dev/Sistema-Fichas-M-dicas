import { Service } from "../interfaces/parameters/parameter.interface";
import ServiceModel from "../models/parameters/service.model";

const insertService = async (service: Service) => {
  const responseInsert = await ServiceModel.create(service);
  return responseInsert;
};

const allServices = async () => {
  const responseAll = await ServiceModel.find({});
  return responseAll;
};
export {
  allServices,
  insertService
};