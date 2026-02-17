import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, getDocs, orderBy, where } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { UserPlus, Shield, Mail, Trash2, Key, Building, Edit2, X, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const { role: currentUserRole, companyId: currentUserCompanyId } = useAuth();
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [availableAreas, setAvailableAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ uid: '', email: '', role: 'recepcion', companyId: '', assignedAreas: [] });

    useEffect(() => {
        if (!currentUserRole) return;

        // Multi-tenancy: admins only see users of their own company. Superadmins see everyone.
        let q;
        if (currentUserRole === 'superadmin') {
            q = query(collection(db, 'users'));
        } else {
            q = query(collection(db, 'users'), where('companyId', '==', currentUserCompanyId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(data);
            setLoading(false);
        });

        // Only superadmins need the organization list for management
        if (currentUserRole === 'superadmin') {
            const qOrg = query(collection(db, 'organizations'), orderBy('name'));
            onSnapshot(qOrg, (snapshot) => {
                setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        }

        return () => unsubscribe();
    }, [currentUserRole, currentUserCompanyId]);

    useEffect(() => {
        if (!currentUserRole) return;

        let q;
        if (currentUserRole === 'superadmin') {
            q = query(collection(db, 'areas'));
        } else {
            q = query(collection(db, 'areas'), where('companyId', '==', currentUserCompanyId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailableAreas(data);
        });

        return () => unsubscribe();
    }, [currentUserRole, currentUserCompanyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // If admin, force the user into the same company
            const finalCompanyId = currentUserRole === 'superadmin' ? formData.companyId : currentUserCompanyId;

            const userData = {
                email: formData.email,
                role: formData.role,
                companyId: finalCompanyId,
                updatedAt: new Date()
            };

            // Only save assignedAreas if role is punto_de_control
            if (formData.role === 'punto_de_control') {
                userData.assignedAreas = formData.assignedAreas || [];
            } else {
                userData.assignedAreas = []; // Clear if role changed
            }

            await setDoc(doc(db, 'users', formData.uid), userData);
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ uid: '', email: '', role: 'recepcion', companyId: currentUserRole === 'superadmin' ? '' : currentUserCompanyId, assignedAreas: [] });
        } catch (error) {
            alert("Error guardando usuario: " + error.message);
        }
    };

    const toggleArea = (areaId) => {
        const current = formData.assignedAreas || [];
        if (current.includes(areaId)) {
            setFormData({ ...formData, assignedAreas: current.filter(id => id !== areaId) });
        } else {
            setFormData({ ...formData, assignedAreas: [...current, areaId] });
        }
    };

    const columns = [
        {
            header: 'Usuario',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Shield size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{row.email || 'Sin Email'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">UID: {row.id}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Empresa',
            render: (row) => {
                const org = organizations.find(o => o.id === row.companyId);
                return (
                    <div className="flex items-center gap-2">
                        <Building size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                            {org ? org.name : '---'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Rol y Acceso',
            render: (row) => (
                <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${row.role === 'administrador' ? 'bg-navy text-white' :
                        row.role === 'superadmin' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                        {row.role}
                    </span>
                    {row.role === 'punto_de_control' && row.assignedAreas && row.assignedAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {row.assignedAreas.map(areaId => {
                                const area = availableAreas.find(a => a.id === areaId);
                                return area ? (
                                    <span key={areaId} className="text-[8px] bg-green-50 dark:bg-green-900/20 text-green-600 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-800 uppercase font-bold">
                                        {area.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    <button onClick={() => {
                        setEditingUser(row);
                        setFormData({
                            uid: row.id,
                            email: row.email,
                            role: row.role,
                            companyId: row.companyId,
                            assignedAreas: row.assignedAreas || []
                        });
                        setIsModalOpen(true);
                    }} className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                    <button onClick={async () => { if (confirm('¿Eliminar permisos?')) await deleteDoc(doc(db, 'users', row.id)); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Seguridad y Usuarios">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <p className="text-slate-500 text-sm italic font-medium">Gestión de acceso por organización y roles.</p>
                    <button onClick={() => { setEditingUser(null); setFormData({ email: '', role: 'recepcion', uid: '', companyId: currentUserCompanyId }); setIsModalOpen(true); }} className="w-full md:w-auto bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all justify-center">
                        <UserPlus size={18} /> Vincular Usuario
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    emptyMessage="No hay usuarios registrados."
                />

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md my-8 rounded-3xl shadow-2xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{editingUser ? 'Editar Perfil' : 'Vincular Usuario'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email del Usuario (Auth)</label>
                                    <input required type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">UID (ID de Firebase Auth)</label>
                                    <input required disabled={!!editingUser} type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-mono text-[11px]" placeholder="ID largo de 28 caracteres..." value={formData.uid} onChange={e => setFormData({ ...formData, uid: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            <option value="recepcion">Recepción</option>
                                            <option value="seguridad">Seguridad (Full)</option>
                                            <option value="punto_de_control">Punto de Control (Solo Validación)</option>
                                            <option value="administrador">Administrador</option>
                                            {currentUserRole === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Organización</label>
                                        <select
                                            required={formData.role !== 'superadmin'}
                                            disabled={currentUserRole !== 'superadmin'}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold disabled:opacity-60"
                                            value={currentUserRole === 'superadmin' ? formData.companyId : currentUserCompanyId}
                                            onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                                        >
                                            {currentUserRole === 'superadmin' ? (
                                                <>
                                                    <option value="">Seleccionar...</option>
                                                    {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                                </>
                                            ) : (
                                                <option value={currentUserCompanyId}>Mi Organización</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {formData.role === 'punto_de_control' && (
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-4 transition-all animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Layers size={16} className="text-primary" />
                                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Áreas a Validar</label>
                                            </div>
                                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                                {formData.assignedAreas?.length || 0} seleccionadas
                                            </span>
                                        </div>

                                        {(() => {
                                            const targetCoId = formData.companyId || currentUserCompanyId;
                                            const filteredAreas = availableAreas.filter(a => a.companyId === targetCoId);

                                            if (filteredAreas.length === 0) {
                                                return (
                                                    <div className="py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                                        <p className="text-[11px] text-slate-400 italic">No hay áreas configuradas para esta organización.</p>
                                                        <p className="text-[9px] text-slate-500 mt-1">Vea la sección "Áreas y Niveles" primero.</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                                    {filteredAreas.map(area => {
                                                        const isSelected = formData.assignedAreas?.includes(area.id);
                                                        return (
                                                            <button
                                                                key={area.id}
                                                                type="button"
                                                                onClick={() => toggleArea(area.id)}
                                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${isSelected
                                                                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/5'
                                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-colors ${isSelected ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-tight">{area.name}</p>
                                                                        <p className="text-[10px] opacity-70 font-medium">Nivel: {area.level}</p>
                                                                    </div>
                                                                </div>
                                                                {isSelected && <CheckCircle2 size={16} className="animate-in zoom-in duration-300" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                        <p className="text-[10px] text-slate-400 italic leading-relaxed bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <span className="font-bold text-primary not-italic">Nota:</span> Un usuario de control solo podrá autorizar visitas destinadas a las áreas marcadas arriba.
                                        </p>
                                    </div>
                                )}
                                <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-all">
                                    Confirmar {editingUser ? 'Cambios' : 'Vinculación'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UserManagement;
