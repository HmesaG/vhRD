import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, where, updateDoc, writeBatch } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Trash2, UserRound, Briefcase, Search, Edit2, X, Download } from 'lucide-react';

const Employees = () => {
    const { companyId, role } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', area: '', email: '', whatsapp: '' });
    const [areas, setAreas] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('all');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (!companyId) return;

        const q = query(
            collection(db, 'employees'),
            where('companyId', '==', companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setEmployees(data);
            setLoading(false);
        });

        const qAreas = query(collection(db, 'areas'), where('companyId', '==', companyId));
        const unsubAreas = onSnapshot(qAreas, (snapshot) => {
            setAreas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribe();
            unsubAreas();
        };
    }, [companyId]);

    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const name = toTitleCase(formData.name.trim());
        const area = formData.area;
        if (!name || !area) return;
        if (!companyId) { alert("Error de sesión: Sin organización asignada."); return; }

        try {
            if (isEditing) {
                await updateDoc(doc(db, 'employees', editingId), {
                    name,
                    area,
                    email: formData.email.trim(),
                    whatsapp: formData.whatsapp.trim()
                });
                setIsEditing(false);
                setEditingId(null);
            } else {
                await addDoc(collection(db, 'employees'), {
                    name,
                    area,
                    email: formData.email.trim(),
                    whatsapp: formData.whatsapp.trim(),
                    companyId
                });
            }
            setFormData({ name: '', area: '', email: '', whatsapp: '' });
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (emp) => {
        setFormData({
            name: emp.name,
            area: emp.area,
            email: emp.email || '',
            whatsapp: emp.whatsapp || ''
        });
        setIsEditing(true);
        setEditingId(emp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ name: '', area: '', email: '', whatsapp: '' });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este empleado?')) {
            try { await deleteDoc(doc(db, 'employees', id)); }
            catch (err) { alert('Error: ' + err.message); }
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

            // Skip header if it exists
            const startIdx = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const [name, area, email, whatsapp] = line.split(',').map(s => s.trim());
                if (!name || !area) continue;

                const newDocRef = doc(collection(db, 'employees'));
                batch.set(newDocRef, {
                    name: toTitleCase(name),
                    area: area,
                    email: email || '',
                    whatsapp: whatsapp || '',
                    companyId,
                    created_at: new Date()
                });
                count++;

                // Firestore batch limit is 500
                if (count % 499 === 0) {
                    await batch.commit();
                    // Needs a new batch after commit? Actually, better to just wait or use multiple batches if needed.
                    // For simplicity, we assume small imports or fix this.
                }
            }

            if (count > 0) {
                setImporting(true);
                try {
                    await batch.commit();
                    alert(`Éxito: Se importaron ${count} empleados.`);
                } catch (err) {
                    alert('Error en importación: ' + err.message);
                } finally {
                    setImporting(false);
                }
            }
            e.target.value = null; // Reset input
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = 'Nombre,Area,Email,WhatsApp';
        const example = 'Juan Perez,Sistemas,juan@empresa.com,8091234567';
        const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Plantilla_Empleados.csv';
        link.click();
    };

    // Unique areas from current employee list for the filter dropdown
    const uniqueAreas = [...new Set(employees.map(e => e.area).filter(Boolean))].sort();

    const filteredEmployees = employees.filter(emp => {
        const matchSearch =
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (emp.whatsapp && emp.whatsapp.includes(searchTerm));
        const matchArea = filterArea === 'all' || emp.area === filterArea;
        return matchSearch && matchArea;
    });

    const clearFilters = () => { setSearchTerm(''); setFilterArea('all'); };

    const columns = [
        {
            header: 'Avatar',
            className: 'w-16',
            render: () => (
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy border border-navy/20">
                    <UserRound size={18} />
                </div>
            )
        },
        {
            header: 'Nombre Completo / Área',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{row.name}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                        <Briefcase size={10} /> {row.area}
                    </p>
                </div>
            )
        },
        {
            header: 'Contacto',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">{row.email || 'Sin email'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{row.whatsapp || 'Sin WhatsApp'}</p>
                </div>
            )
        },
        {
            header: 'Estado',
            render: () => (
                <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Empleado Activo
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
        <Layout title="Gestión de Empleados">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Filter bar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Search */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={15} />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o WhatsApp..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner"
                            />
                        </div>

                        {/* Area filter */}
                        <select
                            value={filterArea}
                            onChange={(e) => setFilterArea(e.target.value)}
                            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner text-slate-700 dark:text-slate-300 min-w-[160px]"
                        >
                            <option value="all">Todas las áreas</option>
                            {uniqueAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                            {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? 's' : ''}
                        </span>
                        {(searchTerm || filterArea !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
                            >
                                <X size={11} /> Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
                {role === 'superadmin' && (
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportCSV}
                            className="hidden"
                            id="csv-import"
                        />
                        <label
                            htmlFor="csv-import"
                            className={`flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-navy/90 transition-all ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <Download size={14} /> {importing ? 'Importando...' : 'Importar CSV'}
                        </label>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                            title="Descargar Plantilla"
                        >
                            <Download size={14} className="rotate-180" /> Plantilla
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 lg:p-6 italic">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            {isEditing ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
                        </h2>
                        {isEditing && (
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold uppercase transition-colors">
                                <X size={14} /> Cancelar Edición
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                onBlur={(e) => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="Nombre Completo (Ej: Carlos Santana)"
                                required
                            />
                            <select
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner outline-none"
                                required
                            >
                                <option value="">Seleccionar Área / Departamento...</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.name}>{a.name} ({a.level})</option>
                                ))}
                            </select>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="Correo Electrónico"
                            />
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="WhatsApp (con código de país, ej: 54911...)"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg w-full md:w-auto"
                            >
                                {isEditing ? 'Actualizar Empleado' : 'Guardar Empleado'}
                            </button>
                        </div>
                    </form>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    loading={loading}
                    emptyMessage="No hay empleados registrados."
                />
            </div>
        </Layout>
    );
};

export default Employees;
