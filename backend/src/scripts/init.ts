import PermissionModel from "../models/parameters/permission.model";
import ProgramModel from "../models/parameters/program.model";
import ServiceModel from "../models/parameters/service.model";
import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";
import UserModel from "../models/user.model";
import connectToDatabase from "../config/mongo";
import { encrypt } from "../utils/bcrypt.handle";

// Crear datos iniciales
async function initializeData() {
  try {
    // Crear permisos iniciales
    const admin = await PermissionModel.create({ name: "Administrador", value: "admin" });
    const crearEditarUsuario = await PermissionModel.create({
      name: "Crear/Editar usuario",
      value: "crear-editar-usuario",
    });
    const verhistorial = await PermissionModel.create({ name: "Ver historial", value: "ver-historial" });
    const agregarEntrada = await PermissionModel.create({ name: "Agregar entrada", value: "agregar-entrada" });
    const crearEditarProfesional = await PermissionModel.create({
      name: "Crear/Editar profesional",
      value: "editar-profesional",
    });
    const verSistrat = await PermissionModel.create({ name: "Ver SISTRAT", value: "ver-sistrat" });

    // Crear programas iniciales
    const muSeguimiento = await ProgramModel.create({ name: "MU - Seguimiento", value: "mu-seguimiento" });
    const paiMujeres = await ProgramModel.create({ name: "PAI - Mujeres", value: "pai-mujeres" });
    const poblacionGeneral = await ProgramModel.create({
      name: "PAI - Población general",
      value: "pai-poblacion-general",
    });
    const pgSeguimiento = await ProgramModel.create({ name: "PG - Seguimiento", value: "pg-seguimiento" });
    const prMujeres = await ProgramModel.create({ name: "PR - Mujeres", value: "pr-mujeres" });
    const prPoblacionGeneral = await ProgramModel.create({
      name: "PR - Población General",
      value: "pr-poblacion-general",
    });

    // Crear servicios iniciales
    const csm = await ServiceModel.create({ code: "CSM", description: "Consulta de salud mental" });
    const vd = await ServiceModel.create({ code: "VD", description: "Visita domiciliaria" });
    const cm = await ServiceModel.create({ code: "CM", description: "Consulta médica" });
    const cpsc = await ServiceModel.create({ code: "CPSC", description: "Consulta psicológica" });
    const pi = await ServiceModel.create({ code: "PI", description: "Psicoterapia individual" });
    const pg = await ServiceModel.create({ code: "PG", description: "Psicoterapia Individual Grupal" });
    const pd = await ServiceModel.create({ code: "PD", description: "Psicodiagnóstico" });
    const cpsiq = await ServiceModel.create({ code: "CPSIQ", description: "Consulta Psiquiátrica" });
    const ipg = await ServiceModel.create({ code: "IPG", description: "Intervención Psicosocial de grupo" });

    // Crear roles de profesionales iniciales
    const trabajadorSocial = await ProfesionalRoleModel.create({ name: "Trabajador social", services: [csm, ipg, vd] });
    const medico = await ProfesionalRoleModel.create({ name: "Médico", services: [cm] });
    const psicologo = await ProfesionalRoleModel.create({ name: "Psicólogo", services: [cpsc, pi, pg, pd] });
    const psiquiatra = await ProfesionalRoleModel.create({ name: "Psiquiatra", services: [cpsiq] });

    const passHash = await encrypt("12345");
    const newUser = await UserModel.create({
      name: "Luis Reyes",
      email: "lreyes@ficlin.cl",
      password: passHash,
      profile: psicologo,
      permissions: [admin, crearEditarUsuario],
      programs: [muSeguimiento, paiMujeres, poblacionGeneral, prMujeres],
    });

    console.log("Datos iniciales creados");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear datos iniciales", error);
    process.exit(1);
  }
}

// Ejecutar la función de inicialización
(async () => {
  await connectToDatabase();
  await initializeData();
})();
