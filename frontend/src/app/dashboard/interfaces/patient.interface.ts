export interface Patient {
  _id?: string;
  admissionDate: string;
  program: {
    name: string
  };
  codigoSistrat: string;
  sistratCenter: string;
  rut: string;
  name: string;
  surname: string;
  secondSurname: string;
  birthDate: string;
  sex: string;
  region: string;
  comuna: string;
  phone: string;
  phoneFamily: string;
  centerOrigin: string;
  registeredDemand: Boolean;
  registeredOnFiclin: boolean;
  registeredAdmissionForm: Boolean;
  fonasa: Boolean;
  alertCie10: Boolean;
  alertConsentimiento: Boolean;
  alertTreatment?: Boolean;
  mainSubstance: string;
  previousTreatments: string;
  atentionRequestDate: string;
  typeContact: string;
  whoRequest: string;
  whoDerives: string;
  careOfferedDate: string;
  estimatedMonth: string;
  demandIsNotAccepted: string;
  firstAtentionDate: string;
  atentionResolutiveDate: string;
  interventionAB: string;
  observations: string;
  opcion_discapacidad?: string;
}

interface Program{
  _id: string;
  name: string;
}