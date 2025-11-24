import { Page } from "puppeteer";
import { Patient } from "../../interfaces/patient.interface";
import PatientModel from "../../models/patient.model";
import Scrapper from "../scrapper";
import { AdmissionForm } from "./../../interfaces/admissionForm.interface";
import ProcessLogger from "../../utils/processLogger";

interface RowData {
  i: number; // Índice de la fila
  id: string; // ID del paciente (celda 0)
  name: string; // Nombre del paciente (celda 1)
  codigoSistrat: string; // Código Sistrat (celda 2)
}

enum Gender {
  Man = "1",
  Woman = "2",
}

class Sistrat {
  scrapper: Scrapper;
  private gender: string | null = null;

  constructor() {
    this.scrapper = new Scrapper(); // Composición: Usa una instancia de Scrapper
  }

  // Método para hacer login en Sistrat
  async login(center: string, logger?: ProcessLogger) {
    console.group(`[Login] Inicio proceso de login para centro: ${center}`);
    await this.logStep(logger, `[Login] Inicio proceso para centro ${center}`);

    try {
      // --- Selección de credenciales ---
      console.group("Preparando variables");
      await this.logStep(logger, "[Login] Seleccionando credenciales");

      const credentials: Record<string, { usuario: string; password: string }> = {
        mujeres: { usuario: "rmorales", password: "Robe1010" },
        hombres: { usuario: "rmorales", password: "Robe0011" },
        alameda: { usuario: "rmoralesn", password: "Robe1234" },
      };

      const creds = credentials[center];

      if (!creds) {
        throw new Error(`Centro no válido: ${center}`);
      }

      const { usuario, password } = creds;

      console.log("Usuario:", usuario);
      console.log("Password:", password ? "[PROTECTED]" : null);
      console.groupEnd();

      // --- Navegar al login ---
      console.group("Navegación inicial");
      const loginUrl = "https://sistrat.senda.gob.cl/sistrat/";
      console.log("URL Login:", loginUrl);

      const page: Page = await this.scrapper.getPage();
      console.log("Página obtenida");

      await this.scrapper.navigateToPage(page, loginUrl);
      console.log("Página cargada");
      console.groupEnd();

      // --- Escribir credenciales ---
      console.group("Escribiendo credenciales");

      await this.scrapper.waitAndType(page, "#txr_usuario", usuario);
      console.log("Usuario ingresado");
      await this.logStep(logger, "[Login] Usuario digitado");

      await this.scrapper.waitAndType(page, "#txr_clave", password);
      console.log("Password ingresado");
      await this.logStep(logger, "[Login] Password digitada");

      console.groupEnd();

      // --- Enviar formulario ---
      console.group("Enviando formulario");

      await this.scrapper.clickButton(page, 'input[value="Ingresar SISTRAT"]');
      console.log("Botón clickeado");

      await page.waitForNavigation({ waitUntil: "networkidle2" });
      console.log("Navegación completada");
      await this.logStep(logger, "[Login] Sesión iniciada correctamente");

      console.groupEnd();

      return page;
    } catch (error) {
      console.error("Error en login SISTRAT", error);
      await this.logStep(logger, `[Login] Error: ${error}`);
      throw new Error("Error en autenticación con SISTRAT");
    } finally {
      console.groupEnd();
    }
  }

  async crearDemanda(patient: Patient) {
    const center = patient.sistratCenter;
    this.gender = patient.sex;
    console.log("center", center);
    console.group(`[Sistrat][crearDemanda] ${patient.rut}`);
    console.log(`[Sistrat][crearDemanda] Iniciando flujo para centro ${center}`);
    const logger = new ProcessLogger(this.getPatientLabel(patient), "crear-demanda");

    let page: Page | null = null;

    try {
      await this.logStep(logger, `[Sistrat][crearDemanda] Inicio flujo centro ${center}`);
      page = await this.login(center, logger);
      console.log("[Sistrat][crearDemanda] Login exitoso, avanzando a creación de demanda");
      await this.logStep(logger, "[Sistrat][crearDemanda] Login completado");

    // Manejo de alertas / confirm / prompt
    page.on("dialog", async (dialog) => {
      console.log("Se detectó un diálogo:", dialog.message());
      await this.logStep(logger, `[Sistrat][crearDemanda] Diálogo detectado: ${dialog.message()}`);
      await dialog.accept(); // O dialog.dismiss() si quieres cancelarlo
    });

      await this.listActiveDemands(page, logger);
      console.log("[Sistrat][crearDemanda] Menú de demandas activas listo, abriendo formulario de creación");
      await this.scrapper.clickButton(page, "#crea_demanda", 15000);
      console.log("Creando demanda en SISTRAT...", patient);
      await this.logStep(logger, "[Sistrat][crearDemanda] Formulario de creación abierto");
      await this.scrapper.waitAndType(page, "#txtrut", patient.rut);
      await this.scrapper.waitAndType(page, "#txtnombre_usuario", patient.name);
      await this.scrapper.waitAndType(page, "#txtapellido_usuario", patient.surname);
      await this.scrapper.waitAndType(page, "#txtapellido2_usuario", patient.secondSurname);

      await this.scrapper.setDateValue(page, "#txt_fecha_nacimiento", patient.birthDate);

      await this.scrapper.setSelectValue(page, "#sexo", patient.sex);
      await this.scrapper.setSelectValue(page, "#selregion", "7");
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.setSelectValue(page, "#selcomuna", patient.comuna);

      await this.scrapper.waitAndType(page, "#int_telefono", patient.phone);
      await this.scrapper.waitAndType(page, "#int_telefono_familiar", patient.phoneFamily);

      await this.scrapper.setSelectValue(page, "#selsustancia_princial", patient.mainSubstance);

      await this.scrapper.setDateValue(page, "#txt_fecha_de_atencion_en_el_establecimiento", patient.atentionRequestDate);

      await this.scrapper.setSelectValue(page, "#int_numero_tratamiento", patient.previousTreatments);
      await this.scrapper.setSelectValue(page, "#tipo_contacto", patient.typeContact);
      await this.scrapper.setSelectValue(page, "#quien_solicita", patient.whoRequest);
      await this.scrapper.setSelectValue(page, "#quien_deriva", patient.whoDerives);

      await this.scrapper.setDateValue(page, "#txt_mes_estimado", patient.estimatedMonth);

      await this.scrapper.setSelectValue(page, "#no_permite_corresponde", patient.demandIsNotAccepted);

      await this.scrapper.setDateValue(page, "#txt_1era_fecha_atencion_realizada", patient.firstAtentionDate);
      await this.scrapper.setDateValue(page, "#txt_fecha_ofrecida_de_atencion_resolutiva", patient.atentionResolutiveDate);
      await this.scrapper.setDateValue(page, "#txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento", patient.careOfferedDate);

      await this.scrapper.setSelectValue(page, "#sel_intervencion_a_b", patient.interventionAB);
      await this.scrapper.waitAndType(page, "#obs", patient.observations);
      //await this.scrapper.setSelectValue(page, "#selcomuna", "150");
      await this.scrapper.clickButton(page, "#mysubmit");
      console.log("[Sistrat][crearDemanda] Formulario enviado, refrescando listado para validar creación");
      await this.logStep(logger, "[Sistrat][crearDemanda] Formulario enviado");

      //await this.scrapper.waitForSeconds(90);
      await this.listActiveDemands(page, logger);
      await this.setDataSistrat(page, patient, logger);
      console.log("[Sistrat][crearDemanda] Datos sincronizados correctamente");
      await this.logStep(logger, "[Sistrat][crearDemanda] Datos sincronizados");

      return true;
    } catch (error) {
      console.error("Error en crearDemanda", error);
      await this.logStep(logger, `[Sistrat][crearDemanda] Error: ${error}`);
      throw new Error(`Error en la creación de la demanda. Error: ${error}`);
    } finally {
      if (page) {
        await this.scrapper.closeBrowser();
      }
      await logger.close();
      console.groupEnd();
    }
  }

  async listActiveDemands(page: Page, logger?: ProcessLogger) {
    console.group("[Sistrat][listActiveDemands]");
    await this.logStep(logger, "[Sistrat][listActiveDemands] Apertura de menú de demandas activas");
    try {
      console.log("[Sistrat][listActiveDemands] Esperando menú principal");
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, "#flyout2");
      console.log("[Sistrat][listActiveDemands] Menú flyout2 abierto, navegando a listado");
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="php/conv1/listado_demanda.php"].ui-corner-all');
      console.log("[Sistrat][listActiveDemands] Listado de demandas solicitado");
      await this.logStep(logger, "[Sistrat][listActiveDemands] Listado solicitado correctamente");
    } catch (error) {
      await this.logStep(logger, `[Sistrat][listActiveDemands] Error: ${error}`);
      throw new Error("Error al listar demandaas");
    } finally {
      console.groupEnd();
    }
  }

  async setDataSistrat(page: Page, patient: Patient, logger?: ProcessLogger) {
    await this.listActiveDemands(page, logger);
    console.group(`[Sistrat][setDataSistrat] ${patient._id}`);
    await this.logStep(logger, `[Sistrat][setDataSistrat] Buscando ${patient._id}`);
    console.log("[Sistrat][setDataSistrat] Refrescando listado para buscar paciente");

    try {
      console.log("[Sistrat][setDataSistrat] Esperando tabla de pacientes");
      await page.waitForSelector("#table_pacientes", { visible: true });

      const patientName = `${patient.name.trim()} ${patient.surname.trim()}`.toLowerCase();
      console.log(`[Sistrat][setDataSistrat] Buscando coincidencia para ${patientName}`);

      const patientOnSistrat: any = await page.evaluate((patientName) => {
        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;

        if (table) {
          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;

            if (objCells) {
              const patient = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase() || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || "", // Captura el texto de la tercera celda (código Sistrat)
                alertTreatment: objCells.item(7)?.querySelector("img")?.getAttribute("title")?.includes("Este usuario ya está en tratamiento en otro Centro") ? true : false, // Captura el atributo "title" de la imagen en la celda
              };
              //// Comparamos con el nombre que estamos buscando
              if (patient.name == patientName) {
                return patient;
              }
            }
          }
        } else {
          return "Tabla no encontrada";
        }
      }, patientName);

      console.log({ patientOnSistrat });
      await this.logStep(logger, `[Sistrat][setDataSistrat] Resultado búsqueda: ${patientOnSistrat ? "encontrado" : "no encontrado"}`);

      if (!patientOnSistrat) {
        console.log(`Paciente ${patientName} no registrado en SISTRAT. `);
        this.scrapper.closeBrowser();
        await this.logStep(logger, `[Sistrat][setDataSistrat] Paciente no encontrado`);
        return null;
      } else {
        console.log("[Sistrat][setDataSistrat] Paciente encontrado, sincronizando campos locales");
        await this.logStep(logger, "[Sistrat][setDataSistrat] Paciente encontrado, actualizando datos");
        if (patientOnSistrat?.codigoSistrat) {
          const patientEntity = await PatientModel.findOne({ _id: patient._id });
          if (patientEntity) {
            patientEntity.codigoSistrat = patientOnSistrat.codigoSistrat;
            await patientEntity.save();
          }
        }

        if (patientOnSistrat?.alertTreatment) {
          const patientEntity = await PatientModel.findOne({ _id: patient._id });
          if (patientEntity) {
            patientEntity.alertTreatment = patientOnSistrat.alertTreatment;
            await patientEntity.save();
          }
        }
      }
    } catch (error) {
      await this.logStep(logger, `[Sistrat][setDataSistrat] Error: ${error}`);
      throw new Error(`Error al setear datos desde SISTRAT. Error: ${error}`);
    } finally {
      console.log("[Sistrat][setDataSistrat] Finalizando sincronización con listado");
      await this.logStep(logger, "[Sistrat][setDataSistrat] Finalizado");
      console.groupEnd();
    }
  }

  async registrarMedicalRecordsByMonth(patient: Patient, month: number, year: number, medicalRecordsGrouped: any) {
    const data: RowData[] = []; // Cambiar aquí el tipo a RowData[]
    console.log("patient for loooogiiiiiin", patient);
    console.group(`[Sistrat][registrarMedicalRecordsByMonth] ${patient._id}`);
    console.log(`[Sistrat][registrarMedicalRecordsByMonth] Iniciando registro para ${month}/${year}`);
    const logger = new ProcessLogger(this.getPatientLabel(patient), "registros-mensuales");

    // this.gender = patient.sex;
    let page: Page | null = null;

    try {
      await this.logStep(logger, `[Sistrat][registrarMedicalRecordsByMonth] Inicio ${month}/${year}`);
      page = await this.login(patient.sistratCenter, logger);
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Login exitoso, navegando a pacientes");
      await this.logStep(logger, "[Sistrat][registrarMedicalRecordsByMonth] Login completado");

      page.on("dialog", async (dialog) => {
        await this.logStep(logger, `[Sistrat][registrarMedicalRecordsByMonth] Diálogo: ${dialog.message()}`);
        await dialog.accept();
      });

      console.log("registrarMedicalRecordsByMonth lueg de login");
      // Cick botón Usuarios
      console.log("Esperando #flyout...");

      await page.waitForSelector("#flyout", { visible: true, timeout: 15000 });
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Flyout disponible, abriendo sección usuarios");

      await this.scrapper.clickButton(page, "#flyout", 15000);
      await page.waitForSelector('a[href*="consultar_paciente.php"]', { visible: true, timeout: 15000 });
      await this.scrapper.clickButton(page, 'a[href*="consultar_paciente.php"]', 15000);
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Vista de usuarios activos abierta");

      // await this.scrapper.clickButton(page, "#flyout");
      // Click botón "Ver usuarios activos"
      // await this.scrapper.clickButton(page, 'a[href="php/consultar_paciente.php"].ui-corner-all');
      console.log("esperando 15 segundos para click en #filtrar");
      await page.waitForSelector("#filtrar", { visible: true, timeout: 15000 });

      // CLick botón filtrar
      await this.scrapper.clickButton(page, "#filtrar");
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Filtro aplicado, buscando paciente");
      await this.logStep(logger, "[Sistrat][registrarMedicalRecordsByMonth] Filtro aplicado");
      await this.scrapper.waitForSeconds(3);
      const patientName = `${patient.name.trim()} ${patient.surname.trim()} ${patient.secondSurname.trim()}`.toLowerCase();
      console.log("patientName", patientName);
      const normalizedTarget = this.normalizeName(patientName);

      const rowPatientSistrat: any = await page.evaluate((normalizedTarget) => {
        console.log("rowPatientSistrat");
        // función de normalización DENTRO del contexto de la página
        const normalize = (name?: string) => {
          if (!name) return "";
          return name
            .normalize("NFD") // separar diacríticos
            .replace(/[\u0300-\u036f]/g, "") // quitar tildes
            .replace(/\s+/g, "") // quitar espacios
            .toLowerCase();
        };

        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;
        console.log("table getElementById", table);

        if (table) {
          console.log("table");

          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;
            console.log("tabla paciente encontrada", objCells);

            if (objCells) {
              // Obtenemos el texto de cada celda relevante
              const patient = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase() || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || false, // Captura el texto de la tercera celda (código Sistrat)
              };

              console.log("patient evaluado", patient);

              console.log("patient.name", normalize(patient.name));
              console.log("normalizedTarget", normalizedTarget);

              // Comparamos con el nombre que estamos buscando
              if (normalize(patient.name) == normalizedTarget) {
                console.log("patient encontrado", patient);

                // Si el nombre coincide se da click en boton Crear Ficha Ingreso
                const button = objCells.item(5)?.querySelector("span[name='fmensual']") as HTMLElement;

                if (button) {
                  // Realizamos el clic en el botón
                  button.click();
                  console.log(`Se hizo clic en el botón de crear ficha mensual para ${patient.name}`);
                  return patient;
                }
                break; // Salimos del bucle cuando encontramos y hacemos clic en el botón
              }
            }
          }
        } else {
          return null; // Tabla no encontrada
        }
        //return data; // Devuelve los datos capturados
      }, normalizedTarget);

      console.log(`rowPatientSistrat resultado: ${rowPatientSistrat}`);
      await this.logStep(logger, `[Sistrat][registrarMedicalRecordsByMonth] Paciente en tabla: ${rowPatientSistrat ? "sí" : "no"}`);
      await page.waitForSelector(".tabla_mensual", { timeout: 5000 });
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Tabla mensual disponible, aplicando registros");

      console.log("IMPORTANTE medicalRecordsGrouped", medicalRecordsGrouped);

      await page.evaluate((medicalRecordsGrouped) => {
        // Buscar la tabla donde están los registros mensuales
        //const table = document.querySelector(".tabla_mensual") as HTMLTableElement | null;
        // En la página hay varias tablas con esa clase, tomamos la segunda (índice 2) que corresponde a "Ejecuciones en Centro"
        const table = document.getElementsByClassName("tabla_mensual")[2] as HTMLTableElement | null;

        if (!table) {
          console.error("No se encontró la tabla mensual");
          return;
        }

        // Iterar sobre los registros que mandas desde Node
        medicalRecordsGrouped.forEach((recordFiclin: any) => {
          // Buscar la fila cuyo servicio coincida con el nombre (columna 0)
          for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];
            const serviceNameOnTableSistrat = row.cells[0]?.innerText.trim().toLowerCase();

            const mappedServicesSISTRAT = {
              "consulta de salud mental": "consulta de salud mental",
              "intervenci?n psicosocial de grupo": "intervención psicosocial de grupo",
              "visita domiciliaria": "visita domiciliaria",
              "consulta m?dica": "consulta médica",
              "consulta psicol?gica": "consulta psicológica",
              "consulta psiqui?trica": "consulta psiquiátrica",
              "psicoterapia individual": "psicoterapia individual",
              "psicoterapia grupal": "psicoterapia grupal",
              "psiocodiagn?stico": "psicodiagnóstico",
              "consultor?a de salud mental": "consulta de salud mental",
              "intervenci?n familiar": "intervención familiar",
            };

            const normalizedServiceOnSistrat = mappedServicesSISTRAT[serviceNameOnTableSistrat];
            console.log("normalizedServiceOnSistrat", normalizedServiceOnSistrat);

            const normalizedServiceFiclin = recordFiclin.service.trim().toLowerCase();

            if (normalizedServiceOnSistrat === normalizedServiceFiclin) {
              console.log("IGUALES");

              // Rellenar los días (cada celda debería tener un input)
              recordFiclin.days.forEach((value: number, dayIndex: number) => {
                if (value > 0) {
                  const input = row.cells[dayIndex + 1]?.querySelector("input") as HTMLInputElement;
                  if (input) {
                    input.value = value.toString();
                    input.dispatchEvent(new Event("input", { bubbles: true })); // disparar evento por si hay listeners
                    input.dispatchEvent(new Event("change", { bubbles: true })); // simula blur/tab
                  }
                }
              });
              break;
            }
          }
        });
      }, medicalRecordsGrouped);

      console.log("medicalRecordsGrouped", medicalRecordsGrouped);
      console.log("Datos ingresados en la tabla, tomando screenshot...");
      // await this.scrapper.waitForSeconds(15);
      // const safePatientName = patientName.replace(/\s+/g, '_').toLowerCase();
      // const filePath = `uploads/screenshots/septiembre2025/${safePatientName}_mes_septiembre.png`;
      // await page.screenshot({ path: filePath, fullPage: true });
      // console.log('screenshot tomado y guardado en:', filePath);
      console.log("esperando mysubmit");

      // 3. Esperar al botón y hacer click

      await this.scrapper.waitForSeconds(50);
      // await this.scrapper.clickButton(page, '#mysubmit', 30000);
      console.log("REGISTRO EXITOSO ATENCIONES MENSUALES");
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Proceso mensual completado");
      await this.logStep(logger, "[Sistrat][registrarMedicalRecordsByMonth] Proceso completado");

      return "REGISTRO EXITOSO ATENCIONES MENSUALES";
    } catch (error) {
      console.log("errror", error);
      await this.logStep(logger, `[Sistrat][registrarMedicalRecordsByMonth] Error: ${error}`);
      throw new Error(`Error en registrar atenciones mensuales: ${error}`);
    } finally {
      console.log("[Sistrat][registrarMedicalRecordsByMonth] Cerrando grupo de logs");
      await logger.close();
      console.groupEnd();
    }
  }

  async registrarFichaIngreso(patient: Patient, admissionForm: AdmissionForm) {
    const data: RowData[] = []; // Cambiar aquí el tipo a RowData[]

    this.gender = patient.sex;
    const logger = new ProcessLogger(this.getPatientLabel(patient), "ficha-ingreso");
    let page: Page | null = null;
    console.group(`[Sistrat][registrarFichaIngreso] ${patient._id}`);
    console.log("[Sistrat][registrarFichaIngreso] Navegando hacia listado de demandas activas");

    try {
      await this.logStep(logger, "[Sistrat][registrarFichaIngreso] Inicio de proceso");
      page = await this.login(patient.sistratCenter, logger);
      console.log("Login Finalizado correctamente");
      await this.logStep(logger, "[Sistrat][registrarFichaIngreso] Login completado");
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, "#flyout2"); // Botón demandas activas
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="php/conv1/listado_demanda.php"].ui-corner-all');

      // await page.waitForSelector("#table_pacientes", { visible: true, timeout: 5000 });
      // const patientName = `${patient.name.trim()} ${patient.surname.trim()}`.toLowerCase();
      const codigoSistrat = patient.codigoSistrat;
      console.log(`[Ficha de Ingreso] Codigo Sistrat: ${codigoSistrat}`);
      await this.scrapper.waitForSeconds(3);
      console.log("[Sistrat][registrarFichaIngreso] Buscando fila del paciente en tabla");

      const rowPatientSistrat: any = await page.evaluate((codigoSistrat) => {
        console.log("Buscando Tabla...");
        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;

        console.log("Tabla resultado: ", table);

        if (table) {
          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;

            if (objCells) {
              // Obtenemos el texto de cada celda relevante
              const patientSistrat = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase() || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || false, // Captura el texto de la tercera celda (código Sistrat)
              };

              // Comparamos con el nombre que estamos buscando
              if (patientSistrat.codigoSistrat == codigoSistrat) {
                // Si el nombre coincide se da click en boton Crear Ficha Ingreso
                const button = objCells.item(4)?.querySelector("span[name='crear_ficha_ingreso']") as HTMLElement;

                if (button) {
                  // Realizamos el clic en el botón
                  button.click();
                  console.log(`[Ficha de ingreso] Click en crear ficha ingreso para ${patientSistrat.name}`);
                  return patientSistrat;
                }
                break; // Salimos del bucle cuando encontramos y hacemos clic en el botón
              }
            }
          }
        } else {
          return null; // Tabla no encontrada
        }
        return data; // Devuelve los datos capturados
      }, codigoSistrat);

      console.log("rowPatientSistrat", rowPatientSistrat);
      await this.logStep(logger, `[Sistrat][registrarFichaIngreso] Paciente encontrado: ${!!rowPatientSistrat}`);

      if (!rowPatientSistrat) {
        console.log(`[Ficha de Ingreso] Paciente No encontrado: ${rowPatientSistrat}`);
        this.scrapper.closeBrowser();
        await this.logStep(logger, "[Sistrat][registrarFichaIngreso] Paciente no encontrado en listado");
        return null;
      }

      // Si se capturo el codigo sistrat se registrar en paciente
      // if (rowPatientSistrat && rowPatientSistrat.codigoSistrat) {
      //   const patientEntity = await PatientModel.findOne({ _id: patient._id });
      //   if (patientEntity) {
      //     patientEntity.codigoSistrat = rowPatientSistrat.codigoSistrat;
      //     await patientEntity.save();
      //   }
      // }

      console.log(`[Ficha de Ingreso] Paciente encontrado: ${rowPatientSistrat}`);
      console.log("[Sistrat][registrarFichaIngreso] Abriendo formulario y completando secciones");
      await this.completeAdmissionForm(page, patient, admissionForm, logger);
      await this.logStep(logger, "[Sistrat][registrarFichaIngreso] Proceso completado");
    } catch (error: any) {
      await this.logStep(logger, `[Sistrat][registrarFichaIngreso] Error: ${error}`);
      throw new Error(`Error al registrar ficha de ingreso en función registrarFichaIngreso: ${error}`);
    } finally {
      console.log("[Sistrat][registrarFichaIngreso] Finalizó el proceso de ficha de ingreso");
      if (page) {
        await this.scrapper.closeBrowser();
      }
      await logger.close();
      console.groupEnd();
    }
  }

  async completeAdmissionForm(page: Page, patient: Patient, admissionForm: AdmissionForm, logger?: ProcessLogger) {
    const urlToCapture = "https://sistrat.senda.gob.cl/sistrat/publico/php/conv1/ajaxs/webservice.php";

    console.log("[completeAdmissionForm] patient: ", patient);
    console.log("[completeAdmissionForm] admissionForm: ", admissionForm);
    console.group(`[Sistrat][completeAdmissionForm] ${patient._id}`);
    await this.logStep(logger, "[Sistrat][completeAdmissionForm] Inicio de formulario");

    // page.on("response", async (response) => {
    //   if (response.url().includes(urlToCapture)) {
    //     const responseFonasa = await response.json();
    //     console.log("Respuesta capturada:", responseFonasa);
    //     if (responseFonasa === 0) {
    //       console.log("Fonasa ok");
    //       const patientEntity = await PatientModel.findOne({ _id: patient._id });
    //       if (patientEntity) {
    //         patientEntity.fonasa = true;
    //         await patientEntity.save();
    //       }
    //     }
    //   }
    // });

    page.on("response", async (response) => {
      try {
        if (response.url().includes(urlToCapture)) {
          const responseFonasa = await response.json();
          console.log("Respuesta capturada:", responseFonasa);

          if (responseFonasa === 0) {
            console.log("Fonasa OK: cerrando popup...");

            // Guardar flag por si necesitas coordinar luego
            const patientEntity = await PatientModel.findOne({ _id: patient._id });

            if (patientEntity) {
              console.log("Paciente encontrado para registrar fonasa");

              patientEntity.fonasa = true;
              await patientEntity.save();
              console.log("patientEntity", patientEntity);
              await this.logStep(logger, "[Sistrat][completeAdmissionForm] Fonasa confirmado");
            } else {
              console.log("Paciente No encontrado para registrar fonasa");
            }

            // 🔥 Esperar que el popup exista en el DOM
            await page.waitForSelector("#popup_ok", { visible: true, timeout: 5000 });

            // 🔥 Cerrar el popup HTML
            await page.click("#popup_ok");

            console.log("Popup Fonasa cerrado correctamente");
          }
        }
      } catch (err) {
        console.error("Error procesando respuesta Fonasa:", err);
      }
    });

    try {
      //this.scrapper.clickButton(page, 'li.ui-corner-top.ui-tabs-selected.ui-state-active a[href="#tabs1"]')
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Datos Básicos");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Datos básicos");
      this.scrapper.clickButton(page, 'a[href="#tabs1"]');

      await this.scrapper.waitAndType(page, "#txtnombre", `${patient.name}`);
      await this.scrapper.waitAndType(page, "#txtapellido", `${patient.surname}`);
      await this.scrapper.waitAndType(page, "#txtapellido2", `${patient.secondSurname}`);
      await this.scrapper.waitAndType(page, "#selsexo", `Mujer`);
      await this.scrapper.waitAndType(page, "#txt_fecha_nacimiento", `${patient.birthDate}`);

      await this.scrapper.setSelectValue(page, "#selorigen_ingreso", admissionForm.selorigen_ingreso);
      await this.scrapper.setSelectValue(page, "#identidad_genero", admissionForm.identidad_genero);
      await this.scrapper.setSelectValue(page, "#orientacion_sexual", admissionForm.orientacion_sexual);
      await this.scrapper.setSelectValue(page, "#discapacidad", admissionForm.discapacidad);
      if (admissionForm.discapacidad === "1") {
        await this.scrapper.setSelectValue(page, "#opcion_discapacidad", admissionForm.opcion_discapacidad);
      }

      //Tab Caracterización demográfica
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Caracterización demográfica");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Caracterización demográfica");
      await this.scrapper.clickButton(page, 'a[href="#tabs2"]');
      await this.scrapper.waitForSeconds(2);
      await this.scrapper.setSelectValue(page, "#txtnacionalidad", admissionForm.txtnacionalidad);

      // 46 Chile - aparecen nuevos select
      
      if(admissionForm.txtnacionalidad ==="46"){
        await this.scrapper.setSelectValue(page, "#seletnia", admissionForm.seletnia);
      }else{
        await this.scrapper.setSelectValue(page, "#documentacion_regularizada", admissionForm.documentacion_regularizada);
      }
      await this.scrapper.setSelectValue(page, "#selestado_civil", admissionForm.selestado_civil);
      await this.scrapper.waitAndType(page, "#int_numero_hijos", admissionForm.int_numero_hijos);
      await this.scrapper.setSelectValue(page, "#selnumero_hijos_ingreso", admissionForm.selnumero_hijos_ingreso);
      await this.scrapper.setSelectValue(page, "#selescolaridad", admissionForm.selescolaridad);
      await this.scrapper.waitForSeconds(2);

      await this.scrapper.setSelectValue(page, "#escolaridad_opc", admissionForm.escolaridad_opc);



      await this.scrapper.setSelectValue(page, "#selmujer_embarazada", admissionForm.selmujer_embarazada);
      await this.scrapper.setSelectValue(page, "#tiene_menores_a_cargo", admissionForm.tiene_menores_a_cargo);
      await this.scrapper.setSelectValue(page, "#selestado_ocupacional", admissionForm.selestado_ocupacional);
      await this.scrapper.waitForSeconds(2);
      if(['17', '18'].includes(admissionForm.selestado_ocupacional)) {
        await this.scrapper.setSelectValue(page, "#laboral_ingresos", admissionForm.laboral_ingresos);
      }
     if(['19', '22'].includes(admissionForm.selestado_ocupacional)) {
        await this.scrapper.setSelectValue(page, "#laboral_ingresos", admissionForm.laboral_detalle);
     }

      await this.scrapper.setSelectValue(page, "#selcon_quien_vive", admissionForm.selcon_quien_vive);
      await this.scrapper.setSelectValue(page, "#selparentesco", admissionForm.selparentesco);
      await this.scrapper.setSelectValue(page, "#seldonde_vive", admissionForm.seldonde_vive);
      await this.scrapper.setSelectValue(page, "#seltenencia_vivienda", admissionForm.seltenencia_vivienda);
      await this.scrapper.setSelectValue(page, "#selnumero_tratamientos_anteriores", admissionForm.selnumero_tratamientos_anteriores);
      await this.scrapper.setSelectValue(page, "#selfecha_ult_trata", admissionForm.selfecha_ult_trata);

      await this.scrapper.clickButton(page, 'a[href="#tabs3"]');
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Consumo de sustancias");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Consumo de sustancias");
      await this.scrapper.waitForSeconds(3);

      await this.scrapper.setSelectValue(page, "#selsustancia_princial", admissionForm.selsustancia_princial);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_1", admissionForm.selotra_sustancia_1);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_2", admissionForm.selotra_sustancia_2);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_3", admissionForm.selotra_sustancia_3);
      await this.scrapper.setSelectValue(page, "#selfrecuencia_consumo", admissionForm.selfrecuencia_consumo);
      await this.scrapper.waitAndType(page, "#txtedad_inicio_consumo", admissionForm.txtedad_inicio_consumo);
      await this.scrapper.setSelectValue(page, "#selvia_administracion", admissionForm.selvia_administracion);
      await this.scrapper.setSelectValue(page, "#selsustancia_inicio", admissionForm.selsustancia_inicio);
      await this.scrapper.setSelectValue(page, "#txtedad_inicio_consumo_inicial", admissionForm.txtedad_inicio_consumo_inicial);

      await this.scrapper.clickButton(page, 'a[href="#tabs4"]');
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Diagnósticos clínicos");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Diagnósticos clínicos");
      await this.scrapper.waitForSeconds(2);

      await this.scrapper.setSelectValue(page, "#seldiagn_consumo_sustancia", admissionForm.seldiagn_consumo_sustancia);
      await this.scrapper.setSelectValue(page, "#selintox_aguda", admissionForm.selintox_aguda);
      await this.scrapper.setSelectValue(page, "#selsindrome_abstinencia", admissionForm.selsindrome_abstinencia);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", admissionForm.seldiagn_psiquiatrico_cie);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", admissionForm.cie1);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie2", admissionForm.seldiagn_psiquiatrico_cie2);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", admissionForm.cie2);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie3", admissionForm.seldiagn_psiquiatrico_cie3);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", admissionForm.cie3);
      await this.scrapper.setSelectValue(page, "#seldiagn_fiscico", admissionForm.seldiagn_fiscico);
      await this.scrapper.setSelectValue(page, "#selotro_problema_atencion", admissionForm.selotro_problema_atencion);
      await this.scrapper.setSelectValue(page, "#selotro_problema_atencion2", admissionForm.selotro_problema_atencion2);
      await this.scrapper.setSelectValue(page, "#selcompromiso_biopsicosocial", admissionForm.selcompromiso_biopsicosocial);

      await this.scrapper.clickButton(page, 'a[href="#tabs5"]');
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Plan de tratamiento");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Plan de tratamiento");
      await this.scrapper.waitForSeconds(2);
      // await this.scrapper.setDateValue(page, "#txt_fecha_nacimiento", patient.birthDate);

      await this.scrapper.setDateValue(page, "#txtfecha_ingreso_tratamiento", admissionForm.txtfecha_ingreso_tratamiento);
      await this.scrapper.setSelectValue(page, "#selconvenio_conace", admissionForm.selconvenio_conace);
      await this.scrapper.setDateValue(page, "#txtfecha_ingreso_conace", admissionForm.txtfecha_ingreso_conace);
      await this.scrapper.setSelectValue(page, "#seltipo_programa", admissionForm.seltipo_programa);
      await this.scrapper.waitForSeconds(2);
      await this.scrapper.setSelectValue(page, "#seltipo_plan", admissionForm.seltipo_plan);
      await this.scrapper.setSelectValue(page, "#selprograma_tribunales", admissionForm.selprograma_tribunales);

      await this.scrapper.waitAndType(page, "#txtrut", "17184793-1");

      await this.scrapper.clickButton(page, "#consulta_fonasa");

      await this.scrapper.setSelectValue(page, "#selconcentimiento_informado", admissionForm.selconcentimiento_informado);

      await this.scrapper.clickButton(page, 'a[href="#tabs6"]');
      console.log("[Sistrat][completeAdmissionForm] Completando pestaña Diagnósticos finales");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Diagnósticos finales");
      await this.scrapper.waitForSeconds(2);

      await this.scrapper.setSelectValue(page, "#sel_diagnostico_1", admissionForm.sel_diagnostico_1);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_2", admissionForm.sel_diagnostico_2);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_3", admissionForm.sel_diagnostico_3);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_4", admissionForm.sel_diagnostico_4);
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Formulario completado");
      await this.logStep(logger, "[Sistrat][completeAdmissionForm] Click en grabar usuario");
      await this.scrapper.clickButton(page, '#mysubmit');
      await this.logStep(logger, "[Sistrat][Ficha de ingreso registrada");

      return true;
    } catch (error) {
      await this.logStep(logger, `[Sistrat][completeAdmissionForm] Error: ${error}`);
      throw new Error(`Error al registrar ficha de ingreso: ${error}`);
    } finally {
      console.groupEnd();
    }
  }

  async updateAlerts(patient: Patient) {
    this.gender = patient.sex;
    const logger = new ProcessLogger(this.getPatientLabel(patient), "actualiza-alertas");
    let page: Page | null = null;
    console.group(`[Sistrat][updateAlerts] ${patient._id}`);

    try {
      await this.logStep(logger, "[Sistrat][updateAlerts] Inicio");
      page = await this.login(patient.sistratCenter, logger);
      await this.scrapper.clickButton(page, "#flyout");
      await this.scrapper.clickButton(page, 'a[href="php/consultar_paciente.php"].ui-corner-all');
      await this.scrapper.clickButton(page, "#filtrar");
      await this.logStep(logger, "[Sistrat][updateAlerts] Listado cargado");
      const patientName = `${patient.name.trim()} ${patient.surname.trim()} ${patient.secondSurname.trim()}`.toLowerCase();
      console.log(`[Sistrat][updateAlerts] Buscando alertas para ${patientName}`);
      await page.waitForSelector("#table_pacientes", { visible: true });
      console.log("[Sistrat][updateAlerts] Tabla cargada, evaluando filas");

      const patientWithAlerts: any = await page.evaluate((patientName) => {
        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;

        if (table) {
          console.log(" tabla encontrada");

          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;

            if (objCells) {
              // Obtenemos el texto de cada celda relevante
              const patient = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase().trim().replace(/\s+/g, " ") || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || false, // Captura el texto de la tercera celda (código Sistrat)
                cie10: false, // Valor booleano a asignar si se encuentra img en cie10
                consentimiento: false,
              };

              // Obtenemos el id del paciente
              const idMatch = objCells.item(8)?.querySelector("span[id^='evaluacion_']");
              if (idMatch) {
                const idSistrat = idMatch.id.split("_")[1]; // Captura el ID del paciente, ej. '251888'

                // Verificar si hay imágenes en 'cie10_' y 'consentimiento_'
                const cie10Element = document.getElementById(`cie10_${idSistrat}`);
                if (cie10Element && cie10Element.querySelector("img")) {
                  patient.cie10 = true; // Asignamos true si hay img en cie10
                }

                const consentimientoElement = document.getElementById(`consentimiento${idSistrat}`);
                if (consentimientoElement && consentimientoElement.querySelector("img")) {
                  patient.consentimiento = true; // Asignamos true si hay img en consentimiento
                }
              }

              // Comparamos con el nombre que estamos buscando
              if (patient.name == patientName) {
                //console.log(objCells.item(8));
                console.log({ patient });

                return patient;
              } else {
                console.log("NO SON IGUALES");
              }
            }
          }
        } else {
          return "Tabla no encontrada";
        }
        console.log("retornando null");

        return null; // Devuelve los datos capturados
      }, patientName);

      if (patientWithAlerts) {
        console.log("[Sistrat][updateAlerts] Paciente encontrado en listado, sincronizando flags");
        await this.logStep(logger, "[Sistrat][updateAlerts] Paciente encontrado, actualizando flags");
        const patientEntity = await PatientModel.findOne({ _id: patient._id });
        if (!patientEntity) return null;
        if (patientWithAlerts.cie10) {
          patientEntity.alertCie10 = true;
          await patientEntity.save();
        }

        if (patientWithAlerts.consentimiento) {
          patientEntity.alertConsentimiento = true;
          await patientEntity.save();
        }
        return patientEntity;
      } else {
        console.log("[Sistrat][updateAlerts] Paciente no encontrado en listado");
        await this.logStep(logger, "[Sistrat][updateAlerts] Paciente no encontrado");
        return null;
      }
    } catch (error) {
      await this.logStep(logger, `[Sistrat][updateAlerts] Error: ${error}`);
      throw error;
    } finally {
      console.groupEnd();
      await logger.close();
    }
  }

  async updateFormCie10(patient: Patient, optionSelected: string) {
    this.gender = patient.sex;
    const logger = new ProcessLogger(this.getPatientLabel(patient), "actualiza-cie10");
    let page: Page | null = null;
    console.group(`[Sistrat][updateFormCie10] ${patient._id}`);

    try {
      await this.logStep(logger, "[Sistrat][updateFormCie10] Inicio");
      page = await this.login(patient.sistratCenter, logger);
      await this.scrapper.clickButton(page, "#flyout");
      await this.scrapper.clickButton(page, 'a[href="php/consultar_paciente.php"].ui-corner-all');
      await this.scrapper.clickButton(page, "#filtrar");
      await this.logStep(logger, "[Sistrat][updateFormCie10] Tabla filtrada");
      const patientName = `${patient.name.trim()} ${patient.surname.trim()} ${patient.secondSurname.trim()}`.toLowerCase();
      console.log(`[Sistrat][updateFormCie10] Buscando paciente ${patientName}`);
      await page.waitForSelector("#table_pacientes", { visible: true });
      console.log("[Sistrat][updateFormCie10] Tabla de pacientes lista");

      const patientRow: any = await page.evaluate((patientName) => {
        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;

        if (table) {
          console.log(" tabla encontrada");

          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;

            if (objCells) {
              const patient = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase().replace(/\s+/g, " ") || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || false, // Captura el texto de la tercera celda (código Sistrat)
              };

              console.log(patient.name);
              console.log(patientName);

              // Comparamos con el nombre que estamos buscando
              if (patient.name == patientName) {
                console.log("objCells");

                // Obtenemos el id del paciente
                const idMatch = objCells.item(8)?.querySelector("span[id^='evaluacion_']");
                console.log({ idMatch });

                if (idMatch) {
                  const idSistrat = idMatch.id.split("_")[1]; // Captura el ID del paciente, ej. '251888'

                  console.log({ idSistrat });

                  const cie10Element = document.getElementById(`cie10_${idSistrat}`);
                  const hasCie10Image = cie10Element && cie10Element.querySelector("img") ? true : false;
                  console.log({ idSistrat, hasCie10Image });

                  return { idSistrat, hasCie10Image }; // Devolvemos el idSistrat y si tiene la imagen o no
                }
                break; // Salimos del bucle cuando encontramos y hacemos clic en el botón
              }
            }
          }
        } else {
          return "Tabla no encontrada";
        }
        return null; // Devuelve los datos capturados
      }, patientName);

      if (patientRow && patientRow.hasCie10Image) {
        console.log("[Sistrat][updateFormCie10] Paciente con CIE10, abriendo formulario");
        await this.logStep(logger, "[Sistrat][updateFormCie10] Actualizando CIE10");
        await page.waitForSelector(`#cie10_${patientRow.idSistrat} img.button`, { visible: true });
        await this.scrapper.clickButton(page, `#cie10_${patientRow.idSistrat} img.button`);
        await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", optionSelected);
      } else {
        console.log("[Sistrat][updateFormCie10] No se encontró paciente o no tiene CIE10 disponible");
        await this.logStep(logger, "[Sistrat][updateFormCie10] Paciente no disponible para edición");
        return null;
      }
    } catch (error) {
      await this.logStep(logger, `[Sistrat][updateFormCie10] Error: ${error}`);
      throw error;
    } finally {
      console.groupEnd();
      await logger.close();
    }
  }

  normalizeName(name: string): string {
    return name
      .normalize("NFD") // separa acentos de letras
      .replace(/[\u0300-\u036f]/g, "") // quita tildes y diacríticos
      .replace(/\s+/g, "") // elimina TODOS los espacios en blanco
      .toLowerCase(); // pasa todo a minúsculas
  }

  private async logStep(logger: ProcessLogger | undefined, message: string) {
    if (logger) {
      await logger.log(message);
    }
  }

  private getPatientLabel(patient: Patient): string {
    return [patient.name, patient.surname, patient.secondSurname].filter(Boolean).join(" ").trim() || "paciente";
  }
}

export default Sistrat;
