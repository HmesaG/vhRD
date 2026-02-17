import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, where, updateDoc, writeBatch } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Trash2, MapPin, Layers, Plus, X, Search, Edit2, Download } from 'lucide-react';

const AreasManagement = () => {
    const { companyId, companyData, role } = useAuth();
    const hasPuntoDeControl = companyData?.hasPuntoDeControl ?? true;
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [formData, setFormData] = useState({ name: '', level: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (!companyId) return;

        const q = query(
            collection(db, 'areas'),
            where('companyId', '==', companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.level.localeCompare(b.level, undefined, { numeric: true }) || a.name.localeCompare(b.name));
            setAreas(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!companyId) return;

        try {
            if (editingArea) {
                await updateDoc(doc(db, 'areas', editingArea.id), {
                    name: formData.name.trim(),
                    level: formData.level.trim()
                });
            } else {
                await addDoc(collection(db, 'areas'), {
                    name: formData.name.trim(),
                    level: formData.level.trim(),
                    companyId
                });
            }
            setIsModalOpen(false);
            setEditingArea(null);
            setFormData({ name: '', level: '' });
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar esta área? Esto podría afectar los registros de visitas activos.')) {
            try {
                await deleteDoc(doc(db, 'areas', id));
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file || !companyId) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result;
            const lines = content.split('\n');
            const batch = writeBatch(db);
            let count = 0;

            const startIdx = lines[0].toLowerCase().includes('nivel') || lines[0].toLowerCase().includes('planta') ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const [level, name] = line.split(',').map(s => s.trim());
                if (!level || !name) continue;

                const newDocRef = doc(collection(db, 'areas'));
                batch.set(newDocRef, {
                    level,
                    name,
                    companyId,
                    created_at: new Date()
                });
                count++;

                if (count % 499 === 0) {
                    await batch.commit();
                }
            }

            if (count > 0) {
                setImporting(true);
                try {
                    await batch.commit();
                    alert(`Éxito: Se importaron ${count} áreas/departamentos.`);
                } catch (err) {
                    alert('Error en importación: ' + err.message);
                } finally {
                    setImporting(false);
                }
            }
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = hasPuntoDeControl ? 'Nivel,Area' : 'Bloque,Departamento';
        const example = hasPuntoDeControl ? 'Planta Baja,Almacen' : 'Sede Norte,Contabilidad';
        const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = hasPuntoDeControl ? 'Plantilla_Areas.csv' : 'Plantilla_Departamentos.csv';
        link.click();
    };

    const filteredAreas = areas.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: 'Nivel / Planta',
            className: 'w-32',
            render: (row) => (
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Layers size={14} />
                    <span className="text-sm">{row.level}</span>
                </div>
            )
        },
        {
            header: 'Nombre del Área',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{row.name}</p>
                    {hasPuntoDeControl && (
                        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Punto de Control Habilitado</p>
                    )}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {
                            setEditingArea(row);
                            setFormData({ name: row.name, level: row.level });
                            setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Mantenimiento de Áreas">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-slate-400">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por área o nivel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 md:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-sm"
                            />
                        </div>
                        {role === 'superadmin' && (
                            <div className="flex items-center">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                    className="hidden"
                                    id="areas-import"
                                />
                                <label
                                    htmlFor="areas-import"
                                    className={`flex items-center gap-2 px-4 py-3 md:py-2.5 bg-navy text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-navy/90 transition-all ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <Download size={14} /> {importing ? 'Importando...' : 'Importar CSV'}
                                </label>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-3 md:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                                    title="Descargar Plantilla"
                                >
                                    <Download size={14} className="rotate-180" /> Plantilla
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setEditingArea(null);
                            setFormData({ name: '', level: '' });
                            setIsModalOpen(true);
                        }}
                        className="bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all w-full md:w-auto justify-center"
                    >
                        <Plus size={18} /> {hasPuntoDeControl ? 'Nueva Área / Nivel' : 'Nuevo Departamento'}
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredAreas}
                    loading={loading}
                    emptyMessage="Aún no has definido áreas ni niveles para esta organización."
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                {editingArea ? (hasPuntoDeControl ? 'Editar Área' : 'Editar Departamento') : (hasPuntoDeControl ? 'Nueva Área / Nivel' : 'Nuevo Departamento')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{hasPuntoDeControl ? 'Nivel / Planta / Piso' : 'Sede / Bloque'}</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Planta Baja, Nivel 1, Sotano..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm"
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{hasPuntoDeControl ? 'Nombre del Área' : 'Nombre del Departamento'}</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Servidores, Gerencia, Almacén..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-all">
                                {editingArea ? 'Guardar Cambios' : (hasPuntoDeControl ? 'Crear Punto de Control' : 'Registrar Departamento')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AreasManagement;
