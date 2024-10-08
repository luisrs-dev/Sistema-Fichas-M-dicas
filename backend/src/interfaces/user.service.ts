import { Types } from "mongoose";
import { User } from "../interfaces/user.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import UserModel from "../models/user.model";

const inerUser = async (user: User) => {
  const responseInsert = await UserModel.create(user);
  return responseInsert;
};

const allUsers = async () => {
  const responseUsers = await UserModel.find({});
  return responseUsers;
};

const usersByProfile = async (profile: string) => {
  const responseUsers = await UserModel.find({ profile });
  return responseUsers;
};

const findUser = async (id: string) => {
  const responseItem = await UserModel.findOne({ _id: id });
  const medicalRecords = await MedicalRecordModel.find({ patient: new Types.ObjectId(id) });

  return {user: responseItem, medicalRecords};
};

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

export { inerUser, allUsers, usersByProfile, findUser };
