import { Types } from "mongoose";
import { User } from "../interfaces/user.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import UserModel from "../models/user.model";
import UserPermissionModel from "../models/parameters/userPermission.model";
import UserProgramModel from "../models/parameters/userProgram.model";
import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";

const inerUser = async (user: User) => {
  const responseInsert = await UserModel.create(user);
  return responseInsert;
};

const allUsers = async () => {
  const responseUsers = await UserModel.find({}).populate(['permissions','programs','profile']);
  return responseUsers;
};

const usersByProfile = async (profile: string) => {
  const responseUsers = await UserModel.find({ profile });
  return responseUsers;
};

const findUser = async (id: string) => {
  try {
    const responseUser = await UserModel.findOne({ _id: id }).populate(['permissions','programs','profile']);
    return { user: responseUser };
  } catch (error) {
    return { status: false, msg: "Usuario no encontrado" };
  }

};

const findServicesByProfile = async (id: string) => {

  try {
    const role = await ProfesionalRoleModel.findById(id).populate('services');
    return role?.services;
  } catch (error) {
    console.error("Error al buscar el rol profesional:", error);
  }
};


const updateUser = async (userId: Types.ObjectId, updatedData: Partial<User>) => {
  try {
    // Buscamos el usuario por ID y actualizamos con los nuevos datos
    const responseUpdate = await UserModel.findByIdAndUpdate(
      userId,         // ID del usuario que se quiere actualizar
      updatedData,    // Datos que se quieren actualizar
      { new: true }   // Esta opción devuelve el documento actualizado
    );

    // Verificamos si se realizó la actualización
    if (!responseUpdate) {
      throw new Error('Usuario no encontrado');
    }

    return responseUpdate;
  } catch (error: any) {
    throw new Error(`Error al actualizar el usuario: ${error.message}`);
  }
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

export { inerUser, allUsers, usersByProfile, findUser, findServicesByProfile, updateUser};
