import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Building2, Plus, Edit2, Trash2, Globe, Phone, Loader2, Search } from 'lucide-react';

const OrganizationManagement = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Removed logo_url, renamed nit -> rnc
    const [formData, setFormData] = useState({
        name: '',
        rnc: '',
        address: '',
        phone: '',
        email: '',
        hasPuntoDeControl: true
    });
    const [searchingRnc, setSearchingRnc] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'organizations'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setOrganizations(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                await updateDoc(doc(db, 'organizations', editingOrg.id), formData);
            } else {
                await addDoc(collection(db, 'organizations'), { ...formData, createdAt: serverTimestamp() });
            }
            setIsModalOpen(false);
            setEditingOrg(null);
            setFormData({ name: '', rnc: '', address: '', phone: '', email: '', hasPuntoDeControl: true });
        } catch (error) { alert("Error: " + error.message); }
    };

    const filteredOrganizations = organizations.filter(o =>
        (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.rnc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: 'Empresa / Organización',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white uppercase">{row.name}</p>
                        <div className="flex gap-2 items-center">
                            <p className="text-[10px] text-slate-400 font-medium tracking-wider font-mono">RNC: {row.rnc || 'S/N'}</p>
                            {row.hasPuntoDeControl && (
                                <span className="text-[8px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase">Punto de Control</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contacto',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Globe size={10} className="text-slate-400" /> {row.email || '---'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone size={10} className="text-slate-400" /> {row.phone || '---'}
                    </p>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    <button onClick={() => {
                        setEditingOrg(row); setFormData({
                            name: row.name || '',
                            rnc: row.rnc || row.nit || '', // Backward compatibility
                            address: row.address || '',
                            phone: row.phone || '',
                            email: row.email || '',
                            hasPuntoDeControl: row.hasPuntoDeControl ?? true
                        }); setIsModalOpen(true);
                    }} className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                    <button onClick={async () => { if (confirm('¿Eliminar esta organización?')) await deleteDoc(doc(db, 'organizations', row.id)); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Mantenimiento de Organizaciones">
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={15} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, RNC o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-sm"
                        />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all justify-center">
                        <Plus size={18} /> Nueva Organización
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredOrganizations}
                    loading={loading}
                    emptyMessage="No se encontraron organizaciones con esos criterios."
                />

                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                    {editingOrg ? 'Editar Organización' : 'Nueva Organización'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus size={24} className="rotate-45" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RNC (Registro Nacional de Contribuyentes)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-mono"
                                            placeholder="Ej: 131..."
                                            value={formData.rnc}
                                            onChange={e => setFormData({ ...formData, rnc: e.target.value })}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={fetchCompanyData}
                                            disabled={searchingRnc || !formData.rnc}
                                            className="bg-navy text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-navy/90 transition-colors"
                                            title="Buscar en DGII"
                                        >
                                            {searchingRnc ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                    <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                        <input type="tel" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Opción Punto de Control</label>
                                            <p className="text-[10px] text-slate-500">Habilita roles de Seguridad y Punto de Control</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-primary rounded-lg"
                                            checked={formData.hasPuntoDeControl}
                                            onChange={e => setFormData({ ...formData, hasPuntoDeControl: e.target.checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                                        {editingOrg ? 'Guardar Cambios' : 'Registrar Empresa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default OrganizationManagement;
