import { useAuth } from '../context/AuthContext';

export const useOrganizationLabels = () => {
    const { companyData } = useAuth();
    const type = (companyData?.address || 'oficina').toLowerCase().trim();

    const isOffice = type === 'oficina';
    
    return {
        isOffice,
        type,
        // Singular noun (capitalized)
        singular: isOffice ? 'Empleado' : 'Inquilino / Propietario',
        // Plural noun (capitalized)
        plural: isOffice ? 'Empleados' : 'Inquilinos / Propietarios',
        // Singular noun (lowercase)
        singularLow: isOffice ? 'empleado' : 'inquilino/propietario',
        // Plural noun (lowercase)
        pluralLow: isOffice ? 'empleados' : 'inquilinos/propietarios',
        // Host / Contact (capitalized)
        hostSingular: isOffice ? 'Anfitrión' : 'Residente',
        // Host / Contact plural (capitalized)
        hostPlural: isOffice ? 'Anfitriones' : 'Residentes',
        // Sidebar item name
        sidebarLabel: isOffice ? 'Empleados' : 'Inquilinos / Propietarios',
        // Page title
        pageTitle: isOffice ? 'Gestión de Empleados' : 'Gestión de Inquilinos y Propietarios',
        // New/Edit labels
        newButton: isOffice ? 'Agregar Nuevo Empleado' : 'Agregar Inquilino/Propietario',
        editButton: isOffice ? 'Editar Empleado' : 'Editar Inquilino/Propietario',
        saveButton: isOffice ? 'Guardar Empleado' : 'Guardar Inquilino/Propietario',
        updateButton: isOffice ? 'Actualizar Empleado' : 'Actualizar Inquilino/Propietario',
        deleteConfirm: isOffice ? '¿Eliminar este empleado?' : '¿Eliminar este inquilino/propietario?',
        emptyMessage: isOffice ? 'No hay empleados registrados.' : 'No hay inquilinos ni propietarios registrados.',
        countLabel: (count) => isOffice 
            ? `${count} empleado${count !== 1 ? 's' : ''}`
            : `${count} inquilino/propietario${count !== 1 ? 's' : ''}`,
        placeholderSearch: isOffice 
            ? 'Buscar por nombre, empresa, empleado o motivo...' 
            : 'Buscar por nombre, empresa, residente o motivo...',
        // CSV headers/template
        csvHeaders: isOffice 
            ? ['Nombre', 'Cédula', 'Empresa', 'Empleado', 'Motivo', 'Área', 'Entrada', 'Salida', 'Estado']
            : ['Nombre', 'Cédula', 'Empresa', 'Residente', 'Motivo', 'Área', 'Entrada', 'Salida', 'Estado'],
        topRequestedTitle: isOffice ? 'Top Empleados (Solicitados)' : 'Top Residentes (Solicitados)',
        csvTemplateFilename: isOffice ? 'Plantilla_Empleados.csv' : 'Plantilla_Inquilinos_Propietarios.csv',
        importSuccess: (count) => isOffice
            ? `Éxito: Se importaron ${count} empleados.`
            : `Éxito: Se importaron ${count} inquilinos/propietarios.`
    };
};
