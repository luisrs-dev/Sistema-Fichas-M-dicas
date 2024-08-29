import { User } from "../interfaces/user.interface";
import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";
import UserModel from "../models/user.model";

const inerUser = async (user: User) => {
  const responseInsert = await UserModel.create(user);
  return responseInsert;
};

const allUsers = async () => {
  const responseUsers = await UserModel.find({}).populate(["permissions", "programs", "profile"]);
  return responseUsers;
};

const usersByProfile = async (profile: string) => {
  const responseUsers = await UserModel.find({ profile });
  return responseUsers;
};

const findUser = async (id: string) => {
  try {
    const responseUser = await UserModel.findOne({ _id: id }).populate(["permissions", "programs", "profile"]);
    return { user: responseUser };
  } catch (error) {
    return { status: false, msg: "Usuario no encontrado" };
  }
};

const findServicesByProfile = async (id: string) => {
  try {
    const role = await ProfesionalRoleModel.findById(id).populate("services");
    return role?.services;
  } catch (error) {
    console.error("Error al buscar el rol profesional:", error);
  }
};

const updateUser = async ({ user, permissions, programs }: any) => {
  try {
    console.log({ user, permissions, programs });

    // Buscar el usuario existente por su correo electrónico
    let userFetched = await UserModel.findOne({ email: user.email }).populate("programs permissions");

    // Si el usuario no existe, retornar un mensaje de error
    if (!userFetched) return "USER_NOT_FOUND";

    // Actualizar los campos del usuario existente
    userFetched.name = user.name || userFetched.name; // Actualiza solo si se proporciona un nuevo valor
    userFetched.profile = user.profile || userFetched.profile; // Actualiza solo si se proporciona un nuevo valor
    userFetched.permissions = permissions || userFetched.permissions; // Actualiza solo si se proporciona un nuevo valor
    userFetched.programs = programs || userFetched.programs; // Actualiza solo si se proporciona un nuevo valor

    // Guardar los cambios en la base de datos
    await userFetched.save();

    userFetched = await UserModel.findById(userFetched._id).populate("programs permissions profile");
    return { status: "ok", message: "Usuario actualizado exitosamente", user: userFetched };
  } catch (error) {
    return { status: "false", message: "Error al actualizar el usuario" };
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

export { allUsers, findServicesByProfile, findUser, inerUser, updateUser, usersByProfile };

