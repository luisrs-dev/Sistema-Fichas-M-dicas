import puppeteer from "puppeteer";
import { Patient } from "../interfaces/patient.interface";

const addToSistrat = async (patient: any) => {
  console.log({ patient });

  const browser = await puppeteer.launch({ headless: false }); // Cambia a true para ejecutar en modo headless
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 }); // Establece el tamaño de la ventana del navegador

  try {
    // Navegar a la página de inicio de sesión del Banco Santander
    await page.goto("https://sistrat.senda.gob.cl/sistrat/", {
      waitUntil: "domcontentloaded",
    });

    // Capturar el input y establecer un valor
    await page.$eval(
      "#txr_usuario",
      (el) => ((el as HTMLInputElement).value = "rmorales")
    );

    // Opcional: Capturar el valor para verificar si se estableció correctamente
    const usuarioIngresado = await page.$eval(
      "#txr_usuario",
      (el) => (el as HTMLInputElement).value
    );
    console.log("Usuario ingresado:", usuarioIngresado);

    // Capturar el input y establecer un valor
    await page.$eval(
      "#txr_clave",
      (el) => ((el as HTMLInputElement).value = "Robe1010")
    );

    // Opcional: Capturar el valor para verificar si se estableció correctamente
    const claveIngresada = await page.$eval(
      "#txr_usuario",
      (el) => (el as HTMLInputElement).value
    );
    console.log("Clave ingresada:", claveIngresada);

    // Hacer clic en el elemento
    await page.click('input[value="Ingresar SISTRAT"]');

    // Opcional: Esperar un tiempo para que la página se cargue completamente
    await page.waitForNavigation();

    // Hacer clic en el elemento "Demandas Activas" por su ID
    await page.click("#flyout2");

    // await page.waitForSelector('.fg-menu.ui-widget-content', { timeout: 5000 });

    // Hacer clic en el elemento "Demandas de atención"
    await page.click('a[href="php/conv1/listado_demanda.php"].ui-corner-all');

    // Esperar a que aparezca el botón "Crear Demanda"
    await page.waitForSelector("#crea_demanda");

    // Hacer clic en el botón "Crear Demanda"
    await page.click("#crea_demanda");

    // Esperar a que aparezca el formulario con ID "frmdatos"
    await page.waitForSelector("#frmdatos");

    // Ingresar el RUT en el campo correspondiente
    await page.type("#txtrut", "171847931");

    await page.waitForSelector("#txtnombre_usuario");
    await page.type("#txtnombre_usuario", patient.name);

    await page.waitForSelector("#txtapellido_usuario");
    await page.type("#txtapellido_usuario", patient.surname);

    await page.waitForSelector("#txtapellido2_usuario");
    await page.type("#txtapellido2_usuario", patient.secondSurname);

    // Fecha Nacimiento
    await page.evaluate((date) => {
      const input = document.getElementById("txt_fecha_nacimiento");
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.birthDate));

    // Sexo
    await page.evaluate((value) => {
      const select = document.getElementById("sexo") as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.sex);

    await page.waitForSelector("#sexo");
    await page.select("#sexo", patient.sex!);

    await page.waitForSelector("#int_telefono");
    await page.type("#int_telefono", patient.phone);

    await page.waitForSelector("#int_telefono_familiar");
    await page.type("#int_telefono_familiar", patient.phoneFamily);

    // Sexo
    await page.evaluate((value) => {
      const select = document.getElementById(
        "selsustancia_princial"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.mainSubstance!);

    // date txt_fecha_de_atencion_en_el_establecimiento
    await page.evaluate((date) => {
      const input = document.getElementById(
        "txt_fecha_de_atencion_en_el_establecimiento"
      );
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.atentionRequestDate!));

    // date txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento
    await page.evaluate((date) => {
      const input = document.getElementById(
        "txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento"
      );
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.atentionResolutiveDate!));

    // select int_numero_tratamiento
    await page.evaluate((value) => {
      const select = document.getElementById(
        "int_numero_tratamiento"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.previousTreatments!);

    // select tipo_contacto
    await page.evaluate((value) => {
      const select = document.getElementById(
        "tipo_contacto"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.typeContact!);

    // select quien_solicita
    await page.evaluate((value) => {
      const select = document.getElementById(
        "quien_solicita"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.whoRequest!);

    //     select quien_deriva
    await page.evaluate((value) => {
      const select = document.getElementById(
        "quien_deriva"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.whoDerives!);

    // date txt_mes_estimado
    await page.evaluate((date) => {
      const input = document.getElementById("txt_mes_estimado");
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.estimatedMonth!));

    //     select no_permite_corresponde
    await page.evaluate((value) => {
      const select = document.getElementById(
        "no_permite_corresponde"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.demandIsNotAccepted!);

    // date txt_1era_fecha_atencion_realizada
    await page.evaluate((date) => {
      const input = document.getElementById(
        "txt_1era_fecha_atencion_realizada"
      );
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.firstAtentionDate!));

    // date txt_fecha_ofrecida_de_atencion_resolutiva
    await page.evaluate((date) => {
      const input = document.getElementById(
        "txt_fecha_ofrecida_de_atencion_resolutiva"
      );
      if (input) {
        // Verificar que el input existe
        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
      } else {
        console.error(
          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
        );
      }
    }, formatDate(patient.atentionResolutiveDate!));

    //     select sel_intervencion_a_b
    await page.evaluate((value) => {
      const select = document.getElementById(
        "sel_intervencion_a_b"
      ) as HTMLSelectElement;
      if (select) {
        select.value = value;
        const event = new Event("change", { bubbles: true });
        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
      } else {
        console.error('El elemento select con id "sexo" no fue encontrado.');
      }
    }, patient.interventionAB!);

    // await page.click("#traeDatoFonasa");
  } catch (e) {
    console.log(e);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB"); // Cambiar el locale si es necesario
};




//const addAdmissionForm = async (patientId: any) => {
//  console.log({ patient });

//  const browser = await puppeteer.launch({ headless: false }); // Cambia a true para ejecutar en modo headless
//  const page = await browser.newPage();
//  await page.setViewport({ width: 1366, height: 768 }); // Establece el tamaño de la ventana del navegador

//  try {
//    // Navegar a la página de inicio de sesión del Banco Santander
//    await page.goto("https://sistrat.senda.gob.cl/sistrat/", {
//      waitUntil: "domcontentloaded",
//    });

//    // Capturar el input y establecer un valor
//    await page.$eval(
//      "#txr_usuario",
//      (el) => ((el as HTMLInputElement).value = "rmorales")
//    );

//    // Opcional: Capturar el valor para verificar si se estableció correctamente
//    const usuarioIngresado = await page.$eval(
//      "#txr_usuario",
//      (el) => (el as HTMLInputElement).value
//    );
//    console.log("Usuario ingresado:", usuarioIngresado);

//    // Capturar el input y establecer un valor
//    await page.$eval(
//      "#txr_clave",
//      (el) => ((el as HTMLInputElement).value = "Robe1010")
//    );

//    // Opcional: Capturar el valor para verificar si se estableció correctamente
//    const claveIngresada = await page.$eval(
//      "#txr_usuario",
//      (el) => (el as HTMLInputElement).value
//    );
//    console.log("Clave ingresada:", claveIngresada);

//    // Hacer clic en el elemento
//    await page.click('input[value="Ingresar SISTRAT"]');

//    // Opcional: Esperar un tiempo para que la página se cargue completamente
//    await page.waitForNavigation();

//    // Hacer clic en el elemento "Demandas Activas" por su ID
//    await page.click("#flyout2");

//    // await page.waitForSelector('.fg-menu.ui-widget-content', { timeout: 5000 });

//    // Hacer clic en el elemento "Demandas de atención"
//    await page.click('a[href="php/conv1/listado_demanda.php"].ui-corner-all');

//    // Esperar a que aparezca el botón "Crear Demanda"
//    await page.waitForSelector("#crea_demanda");

//    // Hacer clic en el botón "Crear Demanda"
//    await page.click("#crea_demanda");

//    // Esperar a que aparezca el formulario con ID "frmdatos"
//    await page.waitForSelector("#frmdatos");

//    // Ingresar el RUT en el campo correspondiente
//    await page.type("#txtrut", "171847931");

//    await page.waitForSelector("#txtnombre_usuario");
//    await page.type("#txtnombre_usuario", patient.name);

//    await page.waitForSelector("#txtapellido_usuario");
//    await page.type("#txtapellido_usuario", patient.surname);

//    await page.waitForSelector("#txtapellido2_usuario");
//    await page.type("#txtapellido2_usuario", patient.secondSurname);

//    // Fecha Nacimiento
//    await page.evaluate((date) => {
//      const input = document.getElementById("txt_fecha_nacimiento");
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.birthDate));

//    // Sexo
//    await page.evaluate((value) => {
//      const select = document.getElementById("sexo") as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.sex);

//    await page.waitForSelector("#sexo");
//    await page.select("#sexo", patient.sex!);

//    await page.waitForSelector("#int_telefono");
//    await page.type("#int_telefono", patient.phone);

//    await page.waitForSelector("#int_telefono_familiar");
//    await page.type("#int_telefono_familiar", patient.phoneFamily);

//    // Sexo
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "selsustancia_princial"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.mainSubstance!);

//    // date txt_fecha_de_atencion_en_el_establecimiento
//    await page.evaluate((date) => {
//      const input = document.getElementById(
//        "txt_fecha_de_atencion_en_el_establecimiento"
//      );
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.atentionRequestDate!));

//    // date txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento
//    await page.evaluate((date) => {
//      const input = document.getElementById(
//        "txt_fecha_atencion_ofrecida_citacion_en_el_establecimiento"
//      );
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.atentionResolutiveDate!));

//    // select int_numero_tratamiento
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "int_numero_tratamiento"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.previousTreatments!);

//    // select tipo_contacto
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "tipo_contacto"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.typeContact!);

//    // select quien_solicita
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "quien_solicita"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.whoRequest!);

//    //     select quien_deriva
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "quien_deriva"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.whoDerives!);

//    // date txt_mes_estimado
//    await page.evaluate((date) => {
//      const input = document.getElementById("txt_mes_estimado");
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.estimatedMonth!));

//    //     select no_permite_corresponde
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "no_permite_corresponde"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.demandIsNotAccepted!);

//    // date txt_1era_fecha_atencion_realizada
//    await page.evaluate((date) => {
//      const input = document.getElementById(
//        "txt_1era_fecha_atencion_realizada"
//      );
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.firstAtentionDate!));

//    // date txt_fecha_ofrecida_de_atencion_resolutiva
//    await page.evaluate((date) => {
//      const input = document.getElementById(
//        "txt_fecha_ofrecida_de_atencion_resolutiva"
//      );
//      if (input) {
//        // Verificar que el input existe
//        input.removeAttribute("readonly"); // Quitar el atributo readonly si está presente
//        (input as HTMLInputElement).value = date; // Type assertion para evitar el error
//      } else {
//        console.error(
//          'El elemento input con id "txt_fecha_nacimiento" no fue encontrado.'
//        );
//      }
//    }, formatDate(patient.atentionResolutiveDate!));

//    //     select sel_intervencion_a_b
//    await page.evaluate((value) => {
//      const select = document.getElementById(
//        "sel_intervencion_a_b"
//      ) as HTMLSelectElement;
//      if (select) {
//        select.value = value;
//        const event = new Event("change", { bubbles: true });
//        select.dispatchEvent(event); // Despachar un evento de cambio para notificar a cualquier manejador
//      } else {
//        console.error('El elemento select con id "sexo" no fue encontrado.');
//      }
//    }, patient.interventionAB!);

//    // await page.click("#traeDatoFonasa");
//  } catch (e) {
//    console.log(e);
//  }
//};


export { addToSistrat };
