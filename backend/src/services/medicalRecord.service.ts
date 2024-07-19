import { Types } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";
import MedicalRecordModel from "../models/medicalRecord.model";

const insertMedicalRecord = async (medicalRecord: MedicalRecord) => {

  console.log({medicalRecord});
  

  const responseInsert = await MedicalRecordModel.create(medicalRecord);
  return responseInsert;
};

const allMedicalRecords = async () => {
  const responseUsers = await MedicalRecordModel.find({});
  return responseUsers;
};

const allMedicalRecordsUser = async (userId: string) => {
  try {
    const medicalRecords = await MedicalRecordModel.find({ patient: new Types.ObjectId(userId) });
    return medicalRecords;
  } catch (error) {
    console.error("Error al recuperar las fichas médicas del usuario:", error);
    throw error;
  }
};
// const findItem = async (id: string) => {
//   const responseItem = await UserModel.find({ _id: id });
//   return responseItem;
// };

// const updateCar = async (id: string, data: Car) => {
//   /**
//    ** findOneAndUpdate
//    ** Por defecto retorna el objeto encontrado antes de actualizar
//    ** Con {new: true} devuelve el objeto actualizado
//    */
//   const responseItem = await UserModel.findOneAndUpdate({ _id: id }, data, {
//     new: true,
//   });
//   return responseItem;
// };

// const deleteCar = async (id: string) => {
//   const responseItem = await UserModel.deleteOne({ _id: id });
//   return responseItem;
// };

export { allMedicalRecords, insertMedicalRecord, allMedicalRecordsUser };

