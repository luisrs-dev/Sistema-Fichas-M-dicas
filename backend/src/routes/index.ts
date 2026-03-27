import { Router } from "express";

const PATH_ROUTER = `${__dirname}`;
import { readdirSync } from "fs";

const router = Router();

/**
 *
 * @param filename index.ts item.ts
 * @returns
 */
const cleanFilename = (filename: string) => {
  const file = filename.split(".").shift();
  return file;
};

readdirSync(PATH_ROUTER).filter((filename) => {
  const cleanName = cleanFilename(filename);
  if (cleanName !== "index") {
    import(`./${cleanName}`).then((moduleRouter) => {
      console.log(`Cargando ruta: /${cleanName}`);
      router.use(`/${cleanName}`, moduleRouter.router);
    });
  }
});

// Registrar manualmente si es necesario o asegurar que el cargador dinámico lo haga
// El cargador dinámico de abajo debería manejarlo si el archivo está en la carpeta routes.

export { router };
