import { useState, useEffect } from 'react';
import { FileData, FileType, CombinedDataRow, ProcessedData, Kpis, BackupData } from '../types';

// --- VALIDATION CONTRACTS ---
// 'Unnamed: 11' is transformed into 'Tipo de pase' before validation occurs.
const VALIDATION_CONTRACT = {
    tickets: ['Fecha de compra', 'Usuario', 'Tickets', 'Tipo de pase'],
    servicios: ['ID salida', 'Fecha', 'Descripción de ruta', 'Tickets utilizados', '% Ocupación'],
    validaciones: ['ID salida', 'Fecha', 'Usuario', 'Tipo_usuario', 'Validado'],
};
const ALIASES = {
    'Fecha de compra': ['fecha de operacion', 'fecha'],
    'Usuario': ['email', 'email de usuario'],
    'ID salida': ['id de salida', 'id servicio'],
    'Descripción de ruta': ['descripcion ruta'],
    '% Ocupación': ['ocupacion'],
};

// --- HELPER FUNCTIONS ---

const findColumnName = (row: any, primary: string): string | null => {
    const keys = Object.keys(row);
    const primaryLower = primary.toLowerCase();
    
    for (const key of keys) {
        if (key.toLowerCase().trim() === primaryLower) return key;
    }

    const aliasList = ALIASES[primary as keyof typeof ALIASES] || [];
    for (const alias of aliasList) {
        for (const key of keys) {
            if(key.toLowerCase().trim() === alias) return key;
        }
    }
    return null;
}

const validateAndMapRow = (row: any, type: FileType) => {
    const mappedRow: any = {};
    const missing: string[] = [];

    VALIDATION_CONTRACT[type].forEach(col => {
        const actualColName = findColumnName(row, col);
        if(actualColName) {
            mappedRow[col] = row[actualColName];
        } else {
            missing.push(col);
        }
    });

    if (missing.length > 0) return { error: `Faltan columnas: ${missing.join(', ')}` };
    
    return { mappedRow: { ...row, ...mappedRow } };
};

const normalizeDate = (date: any): string => {
    if (!date) return 'Invalid Date';
    try {
        if (typeof date === 'number') { // Excel numeric date
            const d = new Date(Math.round((date - 25569) * 86400 * 1000));
            return d.toISOString().split('T')[0];
        }
        let d;
        if (typeof date === 'string' && (date.includes('/') || date.includes('-'))) {
             // Handle DD/MM/YYYY or DD-MM-YYYY
            const parts = date.split(' ')[0].replace(/\//g, '-').split('-');
            if (parts.length === 3) {
                 const [day, month, year] = parts;
                 // Check if format is YYYY-MM-DD
                 if (year.length === 4) {
                    d = new Date(`${year}-${month}-${day}T12:00:00Z`);
                 } else { // Assume DD-MM-YYYY
                    d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
                 }
            } else {
                 d = new Date(date);
            }
        } else {
            d = new Date(date);
        }
        
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toISOString().split('T')[0];
    } catch (e) {
        return 'Invalid Date';
    }
};

const normalizeUserType = (type: any): 'Estudiante' | 'Colaborador' | 'Desconocido' => {
    const t = String(type || '').toLowerCase().trim();
    if (t.includes('alumno') || t.includes('estudiante') || t.includes('student')) return 'Estudiante';
    if (t.includes('colaborador') || t.includes('staff')) return 'Colaborador';
    return 'Desconocido';
};

// --- HOOK ---

export const useDataProcessor = (files: Record<FileType, FileData[]>) => {
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processFiles = () => {
            const hasFiles = Object.values(files).some(f => f.length > 0);
            if (!hasFiles) {
                setProcessedData(null);
                setIsLoading(false);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            setTimeout(() => {
                try {
                    // 1. Pre-process and Transform Tickets data based on user instructions
                    const ticketsData = files.tickets.flatMap(f => f.data).map(row => {
                        const newRow = { ...row };

                        // Instruction: Rename 'Unnamed: 11' to 'Tipo de pase'
                        const tipoPaseOriginalCol = Object.keys(newRow).find(k => k.toLowerCase().trim() === 'unnamed: 11');
                        if (tipoPaseOriginalCol) {
                            newRow['Tipo de pase'] = newRow[tipoPaseOriginalCol];
                            delete newRow[tipoPaseOriginalCol];
                        }
                        
                        // Instruction: Ignore (delete) 'Unnamed: 6'
                        const unnamed6Col = Object.keys(newRow).find(k => k.toLowerCase().trim() === 'unnamed: 6');
                        if (unnamed6Col) {
                            delete newRow[unnamed6Col];
                        }

                        return newRow;
                    });

                    // 2. Consolidate all data with transformed tickets
                    const cleanedData = {
                        tickets: ticketsData, // Use the transformed data
                        servicios: files.servicios.flatMap(f => f.data),
                        validaciones: files.validaciones.flatMap(f => f.data),
                    };

                    // 3. Validate and Clean all data first
                    const backupData: BackupData = {};
                    let validationError: string | null = null;
                    
                    for (const type in cleanedData) {
                        const fileType = type as FileType;
                        const data = cleanedData[fileType];
                        backupData[fileType] = data; // Store raw for backup
                        if (data.length > 0) {
                            const { error: rowError } = validateAndMapRow(data[0], fileType);
                            if (rowError) {
                                validationError = `Error en archivo de ${fileType}: ${rowError}.`;
                                break;
                            }
                        }
                    }

                    if (validationError) {
                        setError(validationError);
                        setProcessedData({ combinedData: null, kpis: null, availableYears: [], availableMonths: [], backupData });
                        setIsLoading(false);
                        return;
                    }

                    // 4. Data Transformation & Mapping
                    const ticketsMap = new Map<string, any[]>();
                    cleanedData.tickets.forEach(ticket => {
                        const userKey = String(findColumnName(ticket, 'Usuario') ? ticket[findColumnName(ticket, 'Usuario')!] : '').toLowerCase().trim();
                        if (!ticketsMap.has(userKey)) ticketsMap.set(userKey, []);
                        ticketsMap.get(userKey)!.push(ticket);
                    });

                    const serviciosMap = new Map<string, any>();
                    cleanedData.servicios.forEach(s => {
                         const key = String(s[findColumnName(s, 'ID salida')!]).trim();
                         if (key) serviciosMap.set(key, s);
                    });

                    // 5. Join Logic (Validation-centric)
                    const combinedData: CombinedDataRow[] = cleanedData.validaciones.map((val: any) => {
                        const fecha = normalizeDate(val[findColumnName(val, 'Fecha')!]);
                        const idSalida = String(val[findColumnName(val, 'ID salida')!]).trim();
                        const usuario = String(val[findColumnName(val, 'Usuario')!]).toLowerCase().trim();
                        
                        const servicio = serviciosMap.get(idSalida);
                        const userTickets = ticketsMap.get(usuario);
                        const ticket = userTickets?.[0];

                        const ocupacionStr = String(servicio?.[findColumnName(servicio, '% Ocupación')!] || '0').replace('%','');
                        const ocupacion = parseFloat(ocupacionStr) / 100 || 0;

                        const validado: 'Sí' | 'No' = String(val[findColumnName(val, 'Validado')!]).toLowerCase() === 'sí' ? 'Sí' : 'No';
                        // Use the already-renamed 'Tipo de pase' column
                        const tipoPaseValue = ticket?.[findColumnName(ticket, 'Tipo de pase')!];

                        return {
                            Fecha: fecha,
                            Usuario: usuario,
                            Tipo_usuario: normalizeUserType(val[findColumnName(val, 'Tipo_usuario')!]),
                            'ID salida': idSalida,
                            'Descripcion ruta': String(servicio?.[findColumnName(servicio, 'Descripción de ruta')!] || val[findColumnName(val, 'Descripción de ruta')!] ||'N/A'),
                            Validado: validado,
                            '% Ocupacion': ocupacion,
                            'Tickets utilizados': parseInt(String(servicio?.[findColumnName(servicio, 'Tickets utilizados')!]), 10) || 0,
                            'Tipo de pase': tipoPaseValue ? String(tipoPaseValue) : undefined,
                            Tickets: parseInt(String(ticket?.[findColumnName(ticket, 'Tickets')!]), 10) || 0,
                        };

                    }).filter(d => d.Fecha !== 'Invalid Date');
                    
                    if (cleanedData.validaciones.length > 0 && combinedData.length === 0) {
                         throw new Error("No se pudieron combinar los datos. Verifique los formatos de fecha y las columnas clave ('ID salida', 'Usuario').");
                    }

                    // 6. Calculate KPIs
                    const kpis: Kpis = {
                        totalTickets: cleanedData.tickets.reduce((sum, t) => sum + (parseInt(String(t.Tickets), 10) || 0), 0),
                        totalEstudiantes: combinedData.filter(d => d.Tipo_usuario === 'Estudiante').length,
                        totalColaboradores: combinedData.filter(d => d.Tipo_usuario === 'Colaborador').length,
                        pasesSemestrales: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('semestral')).length,
                        pasesSemanales: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('semanal')).length,
                        pasesRedondos: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('redondo')).length,
                        pasesVerano: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('verano')).length,
                        pasesMensualColaborador: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('mensual colaborador')).length,
                        pasesEspeciales: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('especial')).length,
                        pasesInvitado: combinedData.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('invitado')).length,
                    };
                    
                    const years = [...new Set(combinedData.map(d => new Date(d.Fecha).getFullYear().toString()))].sort((a, b) => b.localeCompare(a));
                    const months = [...new Set(combinedData.map(d => (new Date(d.Fecha).getMonth() + 1).toString()))].sort((a,b) => parseInt(a) - parseInt(b));

                    setProcessedData({ combinedData, kpis, availableYears: years, availableMonths: months });

                } catch (e: any) {
                    console.error("Error processing files:", e);
                    setError(e.message || 'Ocurrió un error al procesar los archivos.');
                    setProcessedData(null);
                } finally {
                    setIsLoading(false);
                }
            }, 500);
        };
        
        processFiles();
    }, [files]);

    return { processedData, isLoading, error };
};
