
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { FileData, FileType, ProcessedData } from './types';
import { useDataProcessor } from './hooks/useDataProcessor';
import { Toaster, toast } from 'react-hot-toast';


const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<FileType, FileData[]>>(() => {
    try {
      const savedFiles = localStorage.getItem('mayabus_uploaded_files');
      return savedFiles ? JSON.parse(savedFiles) : {
        tickets: [],
        servicios: [],
        validaciones: [],
      };
    } catch (error) {
      console.error("Could not load files from localStorage", error);
      return {
        tickets: [],
        servicios: [],
        validaciones: [],
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mayabus_uploaded_files', JSON.stringify(uploadedFiles));
    } catch (error) {
      console.error("Could not save files to localStorage", error);
    }
  }, [uploadedFiles]);

  const { processedData, isLoading, error } = useDataProcessor(uploadedFiles);
  const [filters, setFilters] = useState({ year: 'all', month: 'all', userType: 'Todos' });

  const handleFileUpload = (file: File, type: FileType) => {
    // Basic file name validation
    if (!file.name.toLowerCase().startsWith(type.slice(0, -1))) { // tickets -> ticket, etc.
        toast.error(`Error: El archivo "${file.name}" no parece ser un archivo de ${type}.`);
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const jsonData = (window as any).XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

        setUploadedFiles(prev => {
          const newFile: FileData = { name: file.name, data: jsonData };
          const existingFileIndex = prev[type].findIndex(f => f.name === newFile.name);

          if (existingFileIndex !== -1) {
            // Replace existing file
            const updatedFiles = [...prev[type]];
            updatedFiles[existingFileIndex] = newFile;
            toast.success(`"${file.name}" reemplazado exitosamente!`);
            return { ...prev, [type]: updatedFiles };
          } else {
            // Add new file
            toast.success(`"${file.name}" cargado exitosamente!`);
            return { ...prev, [type]: [...prev[type], newFile] };
          }
        });
      } catch (err) {
        toast.error(`Error al procesar el archivo: "${file.name}".`);
        console.error(err);
      }
    };
    reader.onerror = () => {
        toast.error(`Error al leer el archivo: "${file.name}".`);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileDelete = (fileName: string, type: FileType) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter(f => f.name !== fileName),
    }));
    // FIX: Changed toast.info to toast.success, as .info does not exist.
    toast.success(`Archivo "${fileName}" eliminado.`);
  };

  const filteredData = useMemo(() => {
    if (!processedData || !processedData.combinedData) return processedData;
    
    let data = processedData.combinedData;

    if (filters.year !== 'all') {
      data = data.filter(d => new Date(d.Fecha).getFullYear() === parseInt(filters.year, 10));
    }
    if (filters.month !== 'all') {
      data = data.filter(d => new Date(d.Fecha).getMonth() + 1 === parseInt(filters.month, 10));
    }
    if (filters.userType !== 'Todos') {
      data = data.filter(d => d.Tipo_usuario === filters.userType);
    }
    
    // Re-calculate KPIs based on filtered data
    const filteredKpis = {
      ...processedData.kpis,
      totalTickets: data.length, // This might need refinement depending on what "total tickets" means for filtered data
      totalEstudiantes: data.filter(d => d.Tipo_usuario === 'Estudiante').length,
      totalColaboradores: data.filter(d => d.Tipo_usuario === 'Colaborador').length,
      pasesSemestrales: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('semestral')).length,
      pasesSemanales: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('semanal')).length,
      pasesRedondos: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('redondo')).length,
      pasesVerano: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('verano')).length,
      pasesMensualColaborador: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('mensual colaborador')).length,
      pasesEspeciales: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('especial')).length,
      pasesInvitado: data.filter(d => (d['Tipo de pase'] || '').toLowerCase().includes('invitado')).length,
    };

    return { ...processedData, combinedData: data, kpis: filteredKpis };
  }, [processedData, filters]);

  return (
    <div className="min-h-screen bg-anahuac-dark font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />
      <div className="flex flex-col md:flex-row">
        <Sidebar 
          onFileUpload={handleFileUpload} 
          uploadedFiles={uploadedFiles}
          onFileDelete={handleFileDelete}
          filters={filters}
          setFilters={setFilters}
          dataYears={processedData?.availableYears || []}
        />
        <main className="flex-1 p-4 md:p-8">
            {isLoading && <div className="text-center text-anahuac-orange text-2xl">Procesando datos...</div>}
            {error && <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-center text-white"><p className="font-bold text-lg">Error de Procesamiento</p><p>{error}</p></div>}
            {!isLoading && (
                <Dashboard data={filteredData} error={error} />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;