import React, { useRef } from 'react';
import { FileData, FileType } from '../types';

interface SidebarProps {
  onFileUpload: (file: File, type: FileType) => void;
  uploadedFiles: Record<FileType, FileData[]>;
  onFileDelete: (fileName: string, type: FileType) => void;
  filters: { year: string; month: string; userType: string };
  setFilters: React.Dispatch<React.SetStateAction<{ year: string; month: string; userType: string }>>;
  dataYears: string[];
}

const fileTypes: { id: FileType; label: string }[] = [
    { id: 'tickets', label: 'Tickets' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'validaciones', label: 'Validaciones' },
];

const Sidebar: React.FC<SidebarProps> = ({ onFileUpload, uploadedFiles, onFileDelete, filters, setFilters, dataYears }) => {
    const fileInputRefs = {
        tickets: useRef<HTMLInputElement>(null),
        servicios: useRef<HTMLInputElement>(null),
        validaciones: useRef<HTMLInputElement>(null),
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0], type);
            e.target.value = ''; // Reset input
        }
    };
    
    const renderFileInput = (type: FileType, label: string) => (
        <div key={type} className="mb-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-200">{label}</h3>
            <button
                onClick={() => fileInputRefs[type].current?.click()}
                className="w-full bg-anahuac-orange hover:bg-anahuac-orange-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
                aria-label={`Cargar archivo de ${label}`}
            >
                Cargar Archivo
            </button>
            <input
                type="file"
                ref={fileInputRefs[type]}
                onChange={(e) => handleFileChange(e, type)}
                className="hidden"
                accept=".xlsx, .xls, .csv"
            />
            <ul className="mt-2 space-y-1">
                {uploadedFiles[type].map(file => (
                    <li key={file.name} className="flex justify-between items-center text-sm bg-gray-700 p-2 rounded">
                        <span className="truncate mr-2">{file.name}</span>
                        <button onClick={() => onFileDelete(file.name, type)} className="text-red-400 hover:text-red-600 font-bold" aria-label={`Eliminar archivo ${file.name}`}>
                            &times;
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <aside className="w-full md:w-80 lg:w-96 bg-anahuac-gray p-6 flex-shrink-0">
            <div className="sticky top-24">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold border-b-2 border-anahuac-orange pb-2 mb-4">Cargar Datos</h2>
                    {fileTypes.map(({ id, label }) => renderFileInput(id, label))}
                </div>
                <div>
                    <h2 className="text-2xl font-bold border-b-2 border-anahuac-orange pb-2 mb-4">Filtros</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="year-filter" className="block mb-1 font-semibold text-gray-300">Año</label>
                            <select id="year-filter" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-anahuac-orange">
                                <option value="all">Todos</option>
                                {dataYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="month-filter" className="block mb-1 font-semibold text-gray-300">Mes</label>
                            <select id="month-filter" value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-anahuac-orange">
                                <option value="all">Todos</option>
                                {monthNames.map((name, index) => <option key={index + 1} value={index + 1}>{name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="user-type-filter" className="block mb-1 font-semibold text-gray-300">Tipo de Usuario</label>
                            <select id="user-type-filter" value={filters.userType} onChange={e => setFilters(f => ({ ...f, userType: e.target.value }))} className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-anahuac-orange">
                                <option value="Todos">Todos</option>
                                <option value="Estudiante">Estudiante</option>
                                <option value="Colaborador">Colaborador</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
