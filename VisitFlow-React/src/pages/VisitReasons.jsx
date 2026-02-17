import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, where, updateDoc } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Trash2, MessageCircle, Settings2, Search, Edit2, X } from 'lucide-react';

const VisitReasons = () => {
    const { companyId } = useAuth();
    const [reasons, setReasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ label: '', requiresBadge: true });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!companyId) return;

        const q = query(
            collection(db, 'reasons'),
            where('companyId', '==', companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.label.localeCompare(b.label));
            setReasons(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const label = toTitleCase(formData.label.trim());
        if (!label) return;
        if (!companyId) { alert("Error de sesión: Sin organización asignada."); return; }

        try {
            if (isEditing) {
                await updateDoc(doc(db, 'reasons', editingId), {
                    label,
                    requiresBadge: formData.requiresBadge
                });
                cancelEdit();
            } else {
                await addDoc(collection(db, 'reasons'), {
                    label,
                    requiresBadge: formData.requiresBadge,
                    companyId
                });
                setFormData({ label: '', requiresBadge: true });
            }
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (reason) => {
        setFormData({ label: reason.label, requiresBadge: reason.requiresBadge });
        setIsEditing(true);
        setEditingId(reason.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ label: '', requiresBadge: true });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este motivo?')) {
            try { await deleteDoc(doc(db, 'reasons', id)); }
            catch (err) { alert('Error: ' + err.message); }
        }
    };

    const filteredReasons = reasons.filter(r =>
        r.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: 'Icono',
            className: 'w-16',
            render: (row) => (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${row.requiresBadge
                    ? 'bg-orange-50 dark:bg-orange-900/10 text-primary border-orange-100 dark:border-orange-900/20'
                    : 'bg-slate-50 dark:bg-slate-900/10 text-slate-400 border-slate-100 dark:border-slate-800'
                    }`}>
                    <MessageCircle size={18} />
                </div>
            )
        },
        {
            header: 'Etiqueta / Carnet',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{row.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${row.requiresBadge ? 'text-orange-500' : 'text-slate-400'}`}>
                        {row.requiresBadge ? 'Uso de Carnet Obligatorio' : 'Sin Carnet (Entrega Rápida)'}
                    </p>
                </div>
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
        <Layout title="Configuración de Motivos">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Search Header */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <span className="absolute left-3 top-3 md:top-2.5 text-slate-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar motivo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 md:py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 lg:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            {isEditing ? 'Editar Motivo' : 'Agregar Nuevo Motivo'}
                        </h2>
                        {isEditing && (
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold uppercase transition-colors">
                                <X size={14} /> Cancelar Edición
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                onBlur={(e) => setFormData({ ...formData, label: toTitleCase(e.target.value) })}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="Ej: Entrevista, Entrega, Soporte..."
                                required
                            />
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="requiresBadge"
                                    checked={formData.requiresBadge}
                                    onChange={(e) => setFormData({ ...formData, requiresBadge: e.target.checked })}
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                />
                                <label htmlFor="requiresBadge" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                                    Requiere Carnet
                                </label>
                            </div>
                            <button
                                type="submit"
                                className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg"
                            >
                                {isEditing ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredReasons}
                    loading={loading}
                    emptyMessage="No hay motivos registrados."
                />
            </div>
        </Layout>
    );
};

export default VisitReasons;
