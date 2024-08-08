export interface Demand {
    patientId: string; // Referencia al paciente
    mainSubstance?: string;
    previousTreatments?: string;
    atentionRequestDate?: string;
    typeContact?: string;
    whoRequest?: string;
    whoDerives?: string;
    careOfferedDate?: string;
    estimatedMonth?: string;
    demandIsNotAccepted?: string;
    firstAtentionDate?: string;
    atentionResolutiveDate?: string;
    interventionAB?: string;
    observations?: string;
  }