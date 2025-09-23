import mongoose from "mongoose";
import PermissionModel from "../models/parameters/permission.model";
import ProgramModel from "../models/parameters/program.model";
import ServiceModel from "../models/parameters/service.model";
import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";
import UserModel from "../models/user.model";
import connectToDatabase from "../config/mongo";
import { encrypt } from "../utils/bcrypt.handle";

async function initializeData() {
  try {
    // --- PERMISOS ---
    const admin = await PermissionModel.findOneAndUpdate(
      { value: "admin" },
      { name: "Administrador", value: "admin" },
      { upsert: true, new: true }
    );

    const crearEditarUsuario = await PermissionModel.findOneAndUpdate(
      { value: "crear-editar-usuario" },
      { name: "Crear/Editar usuario", value: "crear-editar-usuario" },
      { upsert: true, new: true }
    );

    const verHistorial = await PermissionModel.findOneAndUpdate(
      { value: "ver-historial" },
      { name: "Ver historial", value: "ver-historial" },
      { upsert: true, new: true }
    );

    const agregarEntrada = await PermissionModel.findOneAndUpdate(
      { value: "agregar-entrada" },
      { name: "Agregar entrada", value: "agregar-entrada" },
      { upsert: true, new: true }
    );

    const crearEditarProfesional = await PermissionModel.findOneAndUpdate(
      { value: "editar-profesional" },
      { name: "Crear/Editar profesional", value: "editar-profesional" },
      { upsert: true, new: true }
    );

    const verSistrat = await PermissionModel.findOneAndUpdate(
      { value: "ver-sistrat" },
      { name: "Ver SISTRAT", value: "ver-sistrat" },
      { upsert: true, new: true }
    );

    console.log("Permisos creados o actualizados");

    // --- PROGRAMAS ---
    const muSeguimiento = await ProgramModel.findOneAndUpdate(
      { value: "mu-seguimiento" },
      { name: "MU - Seguimiento", value: "mu-seguimiento" },
      { upsert: true, new: true }
    );

    const paiMujeres = await ProgramModel.findOneAndUpdate(
      { value: "pai-mujeres" },
      { name: "PAI - Mujeres", value: "pai-mujeres" },
      { upsert: true, new: true }
    );

    const poblacionGeneral = await ProgramModel.findOneAndUpdate(
      { value: "pai-poblacion-general" },
      { name: "PAI - Población general", value: "pai-poblacion-general" },
      { upsert: true, new: true }
    );

    const pgSeguimiento = await ProgramModel.findOneAndUpdate(
      { value: "pg-seguimiento" },
      { name: "PG - Seguimiento", value: "pg-seguimiento" },
      { upsert: true, new: true }
    );

    const prMujeres = await ProgramModel.findOneAndUpdate(
      { value: "pr-mujeres" },
      { name: "PR - Mujeres", value: "pr-mujeres" },
      { upsert: true, new: true }
    );

    const prPoblacionGeneral = await ProgramModel.findOneAndUpdate(
      { value: "pr-poblacion-general" },
      { name: "PR - Población General", value: "pr-poblacion-general" },
      { upsert: true, new: true }
    );

    console.log("Programas creados o actualizados");

    // --- SERVICIOS ---
    const csm = await ServiceModel.findOneAndUpdate(
      { code: "CSM" },
      { code: "CSM", description: "Consulta de salud mental" },
      { upsert: true, new: true }
    );

    const vd = await ServiceModel.findOneAndUpdate(
      { code: "VD" },
      { code: "VD", description: "Visita domiciliaria" },
      { upsert: true, new: true }
    );

    const cm = await ServiceModel.findOneAndUpdate(
      { code: "CM" },
      { code: "CM", description: "Consulta médica" },
      { upsert: true, new: true }
    );

    const cpsc = await ServiceModel.findOneAndUpdate(
      { code: "CPSC" },
      { code: "CPSC", description: "Consulta psicológica" },
      { upsert: true, new: true }
    );

    const pi = await ServiceModel.findOneAndUpdate(
      { code: "PI" },
      { code: "PI", description: "Psicoterapia individual" },
      { upsert: true, new: true }
    );

    const pg = await ServiceModel.findOneAndUpdate(
      { code: "PG" },
      { code: "PG", description: "Psicoterapia Individual Grupal" },
      { upsert: true, new: true }
    );

    const pd = await ServiceModel.findOneAndUpdate(
      { code: "PD" },
      { code: "PD", description: "Psicodiagnóstico" },
      { upsert: true, new: true }
    );

    const cpsiq = await ServiceModel.findOneAndUpdate(
      { code: "CPSIQ" },
      { code: "CPSIQ", description: "Consulta Psiquiátrica" },
      { upsert: true, new: true }
    );

    const ipg = await ServiceModel.findOneAndUpdate(
      { code: "IPG" },
      { code: "IPG", description: "Intervención Psicosocial de grupo" },
      { upsert: true, new: true }
    );

    console.log("Servicios creados o actualizados");

    // --- ROLES PROFESIONALES ---
    const trabajadorSocial = await ProfesionalRoleModel.findOneAndUpdate(
      { name: "Trabajador social" },
      { name: "Trabajador social", services: [csm._id, ipg._id, vd._id] },
      { upsert: true, new: true }
    );

    const medico = await ProfesionalRoleModel.findOneAndUpdate(
      { name: "Médico" },
      { name: "Médico", services: [cm._id] },
      { upsert: true, new: true }
    );

    const psicologo = await ProfesionalRoleModel.findOneAndUpdate(
      { name: "Psicólogo" },
      { name: "Psicólogo", services: [cpsc._id, pi._id, pg._id, pd._id] },
      { upsert: true, new: true }
    );

    const psiquiatra = await ProfesionalRoleModel.findOneAndUpdate(
      { name: "Psiquiatra" },
      { name: "Psiquiatra", services: [cpsiq._id] },
      { upsert: true, new: true }
    );

    console.log("Roles profesionales creados o actualizados");

    // --- USUARIO INICIAL ---
    const passHash = await encrypt("12345");
    const user = await UserModel.findOneAndUpdate(
      { email: "lreyes@ficlin.cl" },
      {
        name: "Luis Reyes",
        email: "lreyes@ficlin.cl",
        password: passHash,
        profile: psicologo._id,
        permissions: [admin._id, crearEditarUsuario._id],
        programs: [muSeguimiento._id, paiMujeres._id, poblacionGeneral._id, prMujeres._id],
      },
      { upsert: true, new: true }
    );

    console.log("Usuario creado o actualizado:", user.email);

  } catch (error) {
    console.error("Error al crear datos iniciales:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión cerrada");
    process.exit(0);
  }
}

// --- Ejecutar ---
(async () => {
  await connectToDatabase();
  await initializeData();
})();
