
export type FileType = 'tickets' | 'servicios' | 'validaciones';

export interface FileData {
  name: string;
  data: any[];
}

export interface CombinedDataRow {
    // Core fields from joins
    Fecha: string; 
    Usuario: string;
    Tipo_usuario: 'Estudiante' | 'Colaborador' | 'Desconocido' | 'Otro';
    'Descripcion ruta': string;
    Validado: 'Sí' | 'No';
    
    // Fields from Tickets
    'Tipo de pase'?: string;
    Tickets?: number;

    // Fields from Servicios
    'ID salida'?: string;
    '% Ocupacion'?: number;
    'Tickets utilizados'?: number;
    
    // Fields from Validaciones
    'Email de usuarios'?: string;
    horaValidacion?: string;

    // Allow other dynamic keys
    [key: string]: any;
}

export interface Kpis {
    totalTickets: number;
    totalEstudiantes: number;
    totalColaboradores: number;
    pasesSemestrales: number;
    pasesSemanales: number;
    pasesRedondos: number;
    pasesVerano: number;
    pasesMensualColaborador: number;
    pasesEspeciales: number;
    pasesInvitado: number;
}

export interface BackupData {
    tickets?: any[];
    servicios?: any[];
    validaciones?: any[];
}

export interface ProcessedData {
    combinedData: CombinedDataRow[] | null;
    kpis: Kpis | null;
    availableYears: string[];
    availableMonths: string[];
    backupData?: BackupData;
}
