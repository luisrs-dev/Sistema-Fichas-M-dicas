export interface Filters {
    modulo?: string;
    tipo?: string;
    startDate?: string;
    endDate?: string;
    banco?: string;
}

export interface Filter{
    name: string;
    value?: string;
}