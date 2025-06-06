import { Page } from "puppeteer";
import { Patient } from "../../interfaces/patient.interface";
import PatientModel from "../../models/patient.model";
import Scrapper from "../scrapper";
import { AdmissionForm } from "./../../interfaces/admissionForm.interface";

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
  async login() {
    try {
      let page: Page = await this.scrapper.getPage();
      const loginUrl = "https://sistrat.senda.gob.cl/sistrat/"; // URL del formulario de login
      await this.scrapper.navigateToPage(page, loginUrl);

      await page.goto(loginUrl);

      let usuario: string = "rmorales";
      // Para cada genero se asigna unaa clave diferente
      let password: string | null = this.gender == Gender.Man ? "Robe0011" : "Robe1010";

      await this.scrapper.waitAndType(page, "#txr_usuario", usuario);
      await this.scrapper.waitForSeconds(4);

      await this.scrapper.waitAndType(page, "#txr_clave", password);

      await this.scrapper.clickButton(page, 'input[value="Ingresar SISTRAT"] ');
      await page.waitForNavigation();

      return page;
    } catch (error) {
      throw new Error("Error en autenticación con SISTRAT");
    }
  }

  async crearDemanda(patient: any, demand: any) {
    this.gender = patient.sex;
    let page: Page = await this.login();

    try {
      await this.listActiveDemands(page);
      await this.scrapper.clickButton(page, "#crea_demanda", 15000);

      await this.scrapper.waitAndType(page, "#txtrut", "171847931");
      await this.scrapper.waitAndType(page, "#txtnombre_usuario", patient.name);
      await this.scrapper.waitAndType(page, "#txtapellido_usuario", patient.surname);
      await this.scrapper.waitAndType(page, "#txtapellido2_usuario", patient.secondSurname);

      await this.scrapper.setDateValue(page, "#txt_fecha_nacimiento", patient.birthDate);

      await this.scrapper.setSelectValue(page, "#sexo", patient.sex);
      await this.scrapper.setSelectValue(page, "#selregion", "7");

      await this.scrapper.waitAndType(page, "#int_telefono", patient.phone);
      await this.scrapper.waitAndType(page, "#int_telefono_familiar", patient.phoneFamily);

      await this.scrapper.setSelectValue(page, "#selsustancia_princial", demand.mainSubstance);

      await this.scrapper.setDateValue(page, "#txt_fecha_de_atencion_en_el_establecimiento", demand.atentionRequestDate);

      await this.scrapper.setSelectValue(page, "#int_numero_tratamiento", demand.previousTreatments);
      await this.scrapper.setSelectValue(page, "#tipo_contacto", demand.typeContact);
      await this.scrapper.setSelectValue(page, "#quien_solicita", demand.whoRequest);
      await this.scrapper.setSelectValue(page, "#quien_deriva", demand.whoDerives);

      await this.scrapper.setDateValue(page, "#txt_mes_estimado", demand.estimatedMonth);

      await this.scrapper.setSelectValue(page, "#no_permite_corresponde", demand.demandIsNotAccepted);

      await this.scrapper.setDateValue(page, "#txt_1era_fecha_atencion_realizada", demand.firstAtentionDate);
      await this.scrapper.setDateValue(page, "#txt_fecha_ofrecida_de_atencion_resolutiva", demand.atentionResolutiveDate);
      await this.scrapper.setDateValue(page, "#txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento", demand.careOfferedDate);

      await this.scrapper.setSelectValue(page, "#sel_intervencion_a_b", demand.interventionAB);
      await this.scrapper.waitAndType(page, "#obs", demand.observations);
      await this.scrapper.setSelectValue(page, "#selcomuna", "150");


      await this.scrapper.waitForSeconds(90);
      // await this.listActiveDemands(page);
      // await this.setDataSistrat(page, patient);

      return true;
    } catch (error) {
      console.error("Error en crearDemanda", error);
      throw new Error(`Error en la creación de la demanda. Error: ${error}`);
    } finally {
      if (page) {
        await this.scrapper.closeBrowser();
      }
    }
  }

  async listActiveDemands(page: Page) {
    try {
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, "#flyout2");
      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="php/conv1/listado_demanda.php"].ui-corner-all');
    } catch (error) {
      throw new Error("Error al listar demandaas");
    }
  }

  async setDataSistrat(page: Page, patient: Patient) {
    this.listActiveDemands(page);

    try {
      await page.waitForSelector("#table_pacientes", { visible: true });

      const patientName = `${patient.name.trim()} ${patient.surname.trim()}`.toLowerCase();

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

      if(!patientOnSistrat){
        console.log(`Paciente ${patientName} no registrado en SISTRAT. `);
        this.scrapper.closeBrowser();
        return null;
      }else{
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
      throw new Error(`Error al setear datos desde SISTRAT. Error: ${error}`);
    }
  }

  async registrarFichaIngreso(patient: Patient, admissionForm: AdmissionForm) {
    const data: RowData[] = []; // Cambiar aquí el tipo a RowData[]

    this.gender = patient.sex;    
    let page: Page = await this.login();

    try {
      await this.scrapper.clickButton(page, "#flyout2"); // Botón demandas activas
      await this.scrapper.clickButton(page, 'a[href="php/conv1/listado_demanda.php"].ui-corner-all');
  
      // await page.waitForSelector("#table_pacientes", { visible: true, timeout: 5000 });
      const patientName = `${patient.name.trim()} ${patient.surname.trim()}`.toLowerCase();
      console.log(`registrarFichaIngreso patientName: ${patientName}`);
      
  
      const rowPatientSistrat: any = await page.evaluate((patientName) => {
        const table = document.getElementById("table_pacientes") as HTMLTableElement | null;
  
        if (table) {
          // Iteramos sobre las filas de la tabla, comenzando desde la segunda fila (i = 1)
          for (let i = 1; i < table.rows.length; i++) {
            const objCells = table.rows.item(i)?.cells;
  
            if (objCells) {
              // Obtenemos el texto de cada celda relevante
              const patient = {
                id: objCells.item(0)?.innerText || "", // Captura el texto de la primera celda (ID)
                name: objCells.item(1)?.innerText?.toLowerCase() || "", // Captura el texto de la segunda celda (nombre)
                codigoSistrat: objCells.item(2)?.innerText || false, // Captura el texto de la tercera celda (código Sistrat)
              };
  
              // Comparamos con el nombre que estamos buscando
              if (patient.name == patientName) {
                // Si el nombre coincide se da click en boton Crear Ficha Ingreso
                const button = objCells.item(4)?.querySelector("span[name='crear_ficha_ingreso']") as HTMLElement;
  
                if (button) {
                  // Realizamos el clic en el botón
                  button.click();
                  console.log(`Se hizo clic en el botón de crear ficha ingreso para ${patient.name}`);
                  return patient;
                }
                break; // Salimos del bucle cuando encontramos y hacemos clic en el botón
              }
            }
          }
        } else {
          return null; // Tabla no encontrada
        }
        return data; // Devuelve los datos capturados
      }, patientName);

      console.log(`rowPatientSistrat resultado: ${rowPatientSistrat}`);
      if(!rowPatientSistrat){
        this.scrapper.closeBrowser();
        return null;
      }
  
      // Si se capturo el codigo sistrat se registrar en paciente
      if (rowPatientSistrat && rowPatientSistrat.codigoSistrat) {
        const patientEntity = await PatientModel.findOne({ _id: patient._id });
        if (patientEntity) {
          patientEntity.codigoSistrat = rowPatientSistrat.codigoSistrat;
          await patientEntity.save();
        }
      }
  
      if (rowPatientSistrat) {
        await this.completeAdmissionForm(page, patient, admissionForm);
      }
      
    } catch (error: any) {
      throw new Error(`Error al registrar ficha de ingreso en función registrarFichaIngreso: ${error}`);
      
    }


  }

  async completeAdmissionForm(page: Page, patient: Patient, admissionForm: AdmissionForm) {
    const urlToCapture = "https://sistrat.senda.gob.cl/sistrat/publico/php/conv1/ajaxs/webservice.php";

    page.on("response", async (response) => {
      if (response.url().includes(urlToCapture)) {
        const responseFonasa = await response.json();
        console.log("Respuesta capturada:", responseFonasa);
        if (responseFonasa === 0) {
          console.log("Fonasa ok");
          const patientEntity = await PatientModel.findOne({ _id: patient._id });
          if (patientEntity) {
            patientEntity.fonasa = true;
            await patientEntity.save();
          }
        }
      }
    });

    try {
      //this.scrapper.clickButton(page, 'li.ui-corner-top.ui-tabs-selected.ui-state-active a[href="#tabs1"]')
      this.scrapper.clickButton(page, 'a[href="#tabs1"]');

      await this.scrapper.waitAndType(page, "#txtnombre", `${patient.name}`);
      await this.scrapper.waitAndType(page, "#txtapellido", `${patient.surname}`);
      await this.scrapper.waitAndType(page, "#txtapellido2", `${patient.secondSurname}`);
      await this.scrapper.waitAndType(page, "#selsexo", `Mujer`);
      await this.scrapper.waitAndType(page, "#txt_fecha_nacimiento", `${patient.birthDate}`);

      await this.scrapper.waitForSeconds(3);

      await this.scrapper.setSelectValue(page, "#selorigen_ingreso", admissionForm.selorigen_ingreso);
      await this.scrapper.setSelectValue(page, "#identidad_genero", admissionForm.identidad_genero);
      await this.scrapper.setSelectValue(page, "#orientacion_sexual", admissionForm.orientacion_sexual);
      await this.scrapper.setSelectValue(page, "#discapacidad", admissionForm.discapacidad);
      await this.scrapper.setSelectValue(page, "#opcion_discapacidad", admissionForm.opcion_discapacidad);

      await this.scrapper.waitForSeconds(3);
      //Tab Caracterización demográfica
      await this.scrapper.clickButton(page, 'a[href="#tabs2"]');
      await this.scrapper.setSelectValue(page, "#txtnacionalidad", admissionForm.txtnacionalidad);
      await this.scrapper.setSelectValue(page, "#selestado_civil", admissionForm.selestado_civil);
      await this.scrapper.waitAndType(page, "#int_numero_hijos", admissionForm.int_numero_hijos);
      await this.scrapper.setSelectValue(page, "#selnumero_hijos_ingreso", admissionForm.selnumero_hijos_ingreso);
      await this.scrapper.setSelectValue(page, "#selescolaridad", admissionForm.selescolaridad);
      await this.scrapper.setSelectValue(page, "#selmujer_embarazada", admissionForm.selmujer_embarazada);
      await this.scrapper.setSelectValue(page, "#tiene_menores_a_cargo", admissionForm.tiene_menores_a_cargo);
      await this.scrapper.setSelectValue(page, "#selestado_ocupacional", admissionForm.selestado_ocupacional);
      await this.scrapper.setSelectValue(page, "#selcon_quien_vive", admissionForm.selcon_quien_vive);
      await this.scrapper.setSelectValue(page, "#selparentesco", admissionForm.selparentesco);
      await this.scrapper.setSelectValue(page, "#seldonde_vive", admissionForm.seldonde_vive);
      await this.scrapper.setSelectValue(page, "#seltenencia_vivienda", admissionForm.seltenencia_vivienda);
      await this.scrapper.setSelectValue(page, "#selnumero_tratamientos_anteriores", admissionForm.selnumero_tratamientos_anteriores);
      await this.scrapper.setSelectValue(page, "#selfecha_ult_trata", admissionForm.selfecha_ult_trata);

      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="#tabs3"]');

      await this.scrapper.setSelectValue(page, "#selsustancia_princial", admissionForm.selsustancia_princial);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_1", admissionForm.selotra_sustancia_1);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_2", admissionForm.selotra_sustancia_2);
      await this.scrapper.setSelectValue(page, "#selotra_sustancia_3", admissionForm.selotra_sustancia_3);
      await this.scrapper.setSelectValue(page, "#selfrecuencia_consumo", admissionForm.selfrecuencia_consumo);
      await this.scrapper.waitAndType(page, "#txtedad_inicio_consumo", admissionForm.txtedad_inicio_consumo);
      await this.scrapper.setSelectValue(page, "#selvia_administracion", admissionForm.selvia_administracion);
      await this.scrapper.setSelectValue(page, "#selsustancia_inicio", admissionForm.selsustancia_inicio);
      await this.scrapper.setSelectValue(page, "#txtedad_inicio_consumo_inicial", admissionForm.txtedad_inicio_consumo_inicial);

      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="#tabs4"]');

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

      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="#tabs5"]');

      await this.scrapper.setSelectValue(page, "#txtfecha_ingreso_tratamiento", admissionForm.txtfecha_ingreso_tratamiento);
      await this.scrapper.setSelectValue(page, "#selconvenio_conace", admissionForm.selconvenio_conace);
      await this.scrapper.setSelectValue(page, "#txtfecha_ingreso_conace", admissionForm.txtfecha_ingreso_conace);
      await this.scrapper.setSelectValue(page, "#seltipo_programa", admissionForm.seltipo_programa);
      await this.scrapper.setSelectValue(page, "#seltipo_plan", admissionForm.seltipo_plan);
      await this.scrapper.setSelectValue(page, "#selprograma_tribunales", admissionForm.selprograma_tribunales);

      await this.scrapper.waitAndType(page, "#txtrut", "17184793-1");

      await this.scrapper.clickButton(page, "#consulta_fonasa");

      await this.scrapper.setSelectValue(page, "#selconcentimiento_informado", admissionForm.selconcentimiento_informado);

      await this.scrapper.waitForSeconds(3);
      await this.scrapper.clickButton(page, 'a[href="#tabs6"]');

      await this.scrapper.setSelectValue(page, "#sel_diagnostico_1", admissionForm.sel_diagnostico_1);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_2", admissionForm.sel_diagnostico_2);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_3", admissionForm.sel_diagnostico_3);
      await this.scrapper.setSelectValue(page, "#sel_diagnostico_4", admissionForm.sel_diagnostico_4);
      return true;
    } catch (error) {
      throw new Error(`Error al registrar ficha de ingreso: ${error}`);
    }
  }

  async updateAlerts(patient: Patient) {
    this.gender = patient.sex;
    let page: Page = await this.login();
    await this.scrapper.clickButton(page, "#flyout");
    await this.scrapper.clickButton(page, 'a[href="php/consultar_paciente.php"].ui-corner-all');
    await this.scrapper.clickButton(page, "#filtrar");

    const patientName = `${patient.name.trim()} ${patient.surname.trim()} ${patient.secondSurname.trim()}`.toLowerCase();
    await page.waitForSelector("#table_pacientes", { visible: true });

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
      return null;
    }
  }

  async updateFormCie10(patient: Patient, optionSelected: string) {
    this.gender = patient.sex;
    let page: Page = await this.login();
    await this.scrapper.clickButton(page, "#flyout");
    await this.scrapper.clickButton(page, 'a[href="php/consultar_paciente.php"].ui-corner-all');
    await this.scrapper.clickButton(page, "#filtrar");

    const patientName = `${patient.name.trim()} ${patient.surname.trim()} ${patient.secondSurname.trim()}`.toLowerCase();
    await page.waitForSelector("#table_pacientes", { visible: true });

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
      await page.waitForSelector(`#cie10_${patientRow.idSistrat} img.button`, { visible: true });
      await this.scrapper.clickButton(page, `#cie10_${patientRow.idSistrat} img.button`);
      await this.scrapper.setSelectValue(page, "#seldiagn_psiquiatrico_cie", optionSelected);
    } else {
      return null;
    }
  }
}

export default Sistrat;
