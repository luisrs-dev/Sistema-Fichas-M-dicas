import { Schema, model } from "mongoose";
import { AdmissionForm } from "../interfaces/admissionForm.interface";

const AdmissionFormSchema = new Schema<AdmissionForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    centerOrigin: {
      type: String
    }, 
    cie1: {
      type: String
    }, 
    discapacidad: {
      type: String
    }, 
    opcion_discapacidad: {
      type: String
    }, 
    documentacion_regularizada: {
      type: String
    }, 
    escolaridad_opc: {
      type: String
    }, 
    identidad_genero: {
      type: String
    }, 
    int_numero_hijos: {
      type: String
    }, 
    name: {
      type: String
    }, 
    orientacion_sexual: {
      type: String
    }, 
    perso_dormitorio_vivienda: {
      type: String
    }, 
    phone: {
      type: String
    }, 
    phoneFamily: {
      type: String
    }, 
    precariedad_vivienda: {
      type: String
    }, 
    region: {
      type: String
    }, 
    secondSurname: {
      type: String
    }, 
    sel_diagnostico_1: {
      type: String
    }, 
    sel_diagnostico_2: {
      type: String
    }, 
    sel_diagnostico_3: {
      type: String
    }, 
    sel_diagnostico_4: {
      type: String
    }, 
    selcompromiso_biopsicosocial: {
      type: String
    }, 
    selcon_quien_vive: {
      type: String
    }, 
    selconcentimiento_informado: {
      type: String
    }, 
    seldiagn_consumo_sustancia: {
      type: String
    }, 
    seldiagn_fiscico: {
      type: String
    }, 
    seldiagn_psiquiatrico_cie: {
      type: String
    }, 
    seldiagn_psiquiatrico_cie2: {
      type: String
    }, 
    seldiagn_psiquiatrico_cie3: {
      type: String
    }, 
    seldonde_vive: {
      type: String
    }, 
    selescolaridad: {
      type: String
    }, 
    selestado_civil: {
      type: String
    }, 
    selestado_ocupacional: {
      type: String
    }, 
    selfecha_ult_trata: {
      type: String
    }, 
    selfrecuencia_consumo: {
      type: String
    }, 
    selintox_aguda: {
      type: String
    }, 
    selmujer_embarazada: {
      type: String
    }, 
    selnumero_hijos_ingreso: {
      type: String
    }, 
    selnumero_tratamientos_anteriores: {
      type: String
    }, 
    selorigen_ingreso: {
      type: String
    }, 
    selotra_sustancia_1: {
      type: String
    }, 
    selotra_sustancia_2: {
      type: String
    }, 
    selotra_sustancia_3: {
      type: String
    }, 
    selotro_problema_atencion: {
      type: String
    }, 
    selotro_problema_atencion2: {
      type: String
    }, 
    selparentesco: {
      type: String
    }, 
    selsindrome_abstinencia: {
      type: String
    }, 
    selsustancia_inicio: {
      type: String
    }, 
    selsustancia_princial: {
      type: String
    }, 
    seltenencia_vivienda: {
      type: String
    }, 
    seltipo_plan: {
      type: String
    }, 
    seltipo_programa: {
      type: String
    }, 
    selvia_administracion: {
      type: String
    }, 
    sex: {
      type: String
    }, 
    ss_basicos_vivienda: {
      type: String
    }, 
    surname: {
      type: String
    }, 
    tiene_menores_a_cargo: {
      type: String
    }, 
    txtedad_inicio_consumo: {
      type: String
    }, 
    txtedad_inicio_consumo_inicial: {
      type: String
    }, 
    txtfecha_ingreso_conace: {
      type: String
    }, 
    txtfecha_ingreso_tratamiento: {
      type: String
    }, 
    txtnacionalidad: {
      type: String
    }, 
    txtrut: {
      type: String
    }
  },
  { timestamps: true, versionKey: false }
);

const AdmissionFormModel = model("AdmissionForm", AdmissionFormSchema);
export default AdmissionFormModel;
