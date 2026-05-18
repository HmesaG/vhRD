import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { companiesApi } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Trash2, Building2, Search, Plus, X, Loader2, Globe, Edit2 } from 'lucide-react';

const Companies = () => {
    const { companyId } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ rnc: '', name: '' });
    const [searchingRnc, setSearchingRnc] = useState(false);

    const fetchCompanies = useCallback(() => companiesApi.getAll(companyId), [companyId]);
    const { data: fetchedCompanies, refresh: refreshCompanies } = usePolling(fetchCompanies, 5000, [companyId]);

    useEffect(() => {
        if (!fetchedCompanies) return;
        const sorted = [...fetchedCompanies].sort((a, b) => a.name.localeCompare(b.name));
        setCompanies(sorted);
        setLoading(false);
    }, [fetchedCompanies]);

    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase());
    };

    const fetchCompanyData = async () => {
        if (!formData.rnc || formData.rnc.length < 9) {
            alert("Por favor ingresa un RNC válido (mínimo 9 dígitos).");
            return;
        }

        setSearchingRnc(true);
        try {
            const response = await fetch('/api-dgii/Contribuyentes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ "RNC": formData.rnc })
            });

            if (!response.ok) throw new Error('Error al consultar API');

            const data = await response.json();

            // Handle array response if API returns specific structure
            let validData = data;
            if (Array.isArray(data)) {
                validData = data.length > 0 ? data[0] : {};
            }

            // Flexible key search for name
            const keys = Object.keys(validData);
            const nameKey = keys.find(k =>
                k.toLowerCase().includes('nomb') ||
                k.toLowerCase().includes('razon') ||
                k.toLowerCase().includes('social') ||
                k.toLowerCase() === 'name' ||
                k.toLowerCase() === 'description'
            );

            const companyName = nameKey ? validData[nameKey] : '';

            if (companyName) {
                setFormData(prev => ({ ...prev, name: toTitleCase(companyName) }));
            } else {
                console.error("Available keys:", keys);
                alert(`RNC validado pero sin nombre claro. Propiedades detectadas: ${keys.join(', ')}`);
            }

        } catch (error) {
            console.error("Error fetching company:", error);
            alert("No se pudo obtener datos automáticos. Por favor ingresa el nombre manualmente.");
        } finally {
            setSearchingRnc(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const name = toTitleCase(formData.name.trim());
        if (!name) return;
        if (!companyId) { alert("Error de sesión: Sin organización asignada."); return; }

        try {
            if (isEditing) {
                await companiesApi.update(editingId, { name, rnc: formData.rnc.trim() });
            } else {
                await companiesApi.create({ name, rnc: formData.rnc.trim(), company_id: companyId });
            }
            refreshCompanies();
            closeModal();
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (company) => {
        setFormData({ rnc: company.rnc || '', name: company.name });
        setEditingId(company.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingId(null);
        setFormData({ rnc: '', name: '' });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar esta empresa?')) {
            try { await companiesApi.delete(id); refreshCompanies(); }
            catch (err) { alert('Error: ' + err.message); }
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.rnc && c.rnc.includes(searchTerm))
    );

    const columns = [
        {
            header: 'RNC',
            className: 'w-32',
            render: (row) => (
                <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-block">
                    {row.rnc || 'N/A'}
                </div>
            )
        },
        {
            header: 'Nombre de la Empresa',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{row.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wider flex items-center gap-1">
                        <Building2 size={10} /> Cliente Registrado
                    </p>
                </div>
            )
        },
        {
            header: 'Estado',
            render: () => (
                <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Activa
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Directorio de Empresas">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <span className="absolute left-3 top-3 md:top-2.5 text-slate-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar empresa por nombre o RNC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 md:py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Nueva Empresa
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredCompanies}
                    loading={loading}
                    emptyMessage="No se encontraron empresas."
                />

                {/* Modal Creación */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                        {isEditing ? 'Editar Empresa' : 'Registrar Empresa'}
                                    </h3>
                                    <p className="text-xs text-slate-500">Consulta RNC o ingresa manualmente</p>
                                </div>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">RNC (Registro Nacional de Contribuyentes)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.rnc}
                                            onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary font-mono placeholder:font-sans"
                                            placeholder="Ej: 122029109"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={fetchCompanyData}
                                            disabled={searchingRnc || !formData.rnc}
                                            className="bg-navy text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-navy/90 transition-colors"
                                            title="Buscar en DGII"
                                        >
                                            {searchingRnc ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic ml-1">
                                        * Ingresa el RNC y presiona el botón <Globe size={10} className="inline" /> para buscar datos automáticamente.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre / Razón Social</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                        placeholder="Nombre de la empresa..."
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white py-4 rounded-xl text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-2"
                                >
                                    {isEditing ? 'Actualizar Empresa' : 'Guardar Empresa'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Companies;
