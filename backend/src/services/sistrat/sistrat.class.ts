import { Page } from "puppeteer";
import Scrapper from "../scrapper";

class Sistrat {
  scrapper: Scrapper;

  constructor() {
    this.scrapper = new Scrapper(); // Composición: Usa una instancia de Scrapper
  }

  // Método para hacer login en Sistrat
  async login() {
    let page: Page = await this.scrapper.getPage();
    const loginUrl = "https://sistrat.senda.gob.cl/sistrat/"; // URL del formulario de login
    await this.scrapper.navigateToPage(page, loginUrl);
    
    await page.goto(loginUrl);

    await this.scrapper.waitAndType(page, "#txr_usuario", 'rmorales');
    await this.scrapper.waitForSeconds(4);

    await this.scrapper.waitAndType(page, "#txr_clave", 'Robe1010');


    await this.scrapper.clickButton(page, 'input[value="Ingresar SISTRAT"] ');
    await page.waitForNavigation();

    return page;

  }

  async crearDemanda(patient: any, demand: any){

    let page: Page = await this.login();

    await this.scrapper.clickButton(page, '#flyout2');
    await this.scrapper.clickButton(page, 'a[href="php/conv1/listado_demanda.php"].ui-corner-all');
    
    await this.scrapper.clickButton(page, '#crea_demanda');
    
    await this.scrapper.waitAndType(page, '#txtrut', "171847931");
    await this.scrapper.waitAndType(page, '#txtnombre_usuario', patient.name);
    await this.scrapper.waitAndType(page, '#txtapellido_usuario', patient.surname);
    await this.scrapper.waitAndType(page, '#txtapellido2_usuario', patient.secondSurname);
    
    await this.scrapper.setDateValue(page, '#txt_fecha_nacimiento', patient.birthDate);
    
    await this.scrapper.setSelectValue(page, '#sexo', patient.sex);
    await this.scrapper.waitAndType(page, '#int_telefono', patient.phone);
    await this.scrapper.waitAndType(page, '#int_telefono_familiar', patient.phoneFamily);

    await this.scrapper.setSelectValue(page, '#selsustancia_princial', demand.mainSubstance);

    await this.scrapper.setDateValue(page, '#txt_fecha_de_atencion_en_el_establecimiento', demand.atentionRequestDate);

    await this.scrapper.setSelectValue(page, '#int_numero_tratamiento', demand.previousTreatments);
    await this.scrapper.setSelectValue(page, '#tipo_contacto', demand.typeContact);
    await this.scrapper.setSelectValue(page, '#quien_solicita', demand.whoRequest);
    await this.scrapper.setSelectValue(page, '#quien_deriva', demand.whoDerives);

    await this.scrapper.setDateValue(page, '#txt_mes_estimado', demand.estimatedMonth);

    await this.scrapper.setSelectValue(page, '#no_permite_corresponde', demand.demandIsNotAccepted);

    await this.scrapper.setDateValue(page, '#txt_1era_fecha_atencion_realizada', demand.firstAtentionDate);
    await this.scrapper.setDateValue(page, '#txt_fecha_ofrecida_de_atencion_resolutiva', demand.atentionResolutiveDate);

    await this.scrapper.setSelectValue(page, '#sel_intervencion_a_b', demand.interventionAB);

    return page;
 }

}

export default Sistrat;
