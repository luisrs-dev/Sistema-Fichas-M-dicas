export interface Patient {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  admissionDate: string;
  program: {
    _id?: string,
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
  alertEvaluacion: Boolean;
  alertIntegracionSocial: Boolean;
  alertEgreso: boolean;
  alertDiagnosticoSocial: boolean;
  alertTreatment?: Boolean;
  active?: boolean;
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
  hasTopForm?: boolean;
  hasSocialForm?: boolean;
  hasEvaluationForm?: boolean;
  hasSocialDiagnosisForm?: boolean;
}

interface Program {
  _id: string;
  name: string;
}