import React, { useState, useEffect, useCallback } from 'react';
import { usersApi, organizationsApi, areasApi } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { UserPlus, Shield, Mail, Trash2, Key, Building, Edit2, X, CheckCircle2, Layers, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const { role: currentUserRole, companyId: currentUserCompanyId } = useAuth();
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [availableAreas, setAvailableAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '', role: 'recepcion', companyId: '', assignedAreas: [] });

    const fetchUsers = useCallback(async () => {
        const all = await usersApi.getAll();
        if (currentUserRole === 'superadmin') return all;
        return all.filter(u => u.companyId === currentUserCompanyId);
    }, [currentUserRole, currentUserCompanyId]);
    const { data: fetchedUsers, refresh: refreshUsers } = usePolling(fetchUsers, 5000, [currentUserRole, currentUserCompanyId]);

    const fetchOrgs = useCallback(() => currentUserRole === 'superadmin' ? organizationsApi.getAll() : Promise.resolve([]), [currentUserRole]);
    const { data: fetchedOrgs } = usePolling(fetchOrgs, 30000, [currentUserRole]);

    const fetchAreas = useCallback(async () => {
        const all = await areasApi.getAll();
        if (currentUserRole === 'superadmin') return all;
        return all.filter(a => a.companyId === currentUserCompanyId);
    }, [currentUserRole, currentUserCompanyId]);
    const { data: fetchedAreas } = usePolling(fetchAreas, 15000, [currentUserRole, currentUserCompanyId]);

    useEffect(() => {
        if (fetchedUsers) {
            const sorted = [...fetchedUsers].sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            setUsers(sorted);
            setLoading(false);
        }
    }, [fetchedUsers]);

    useEffect(() => {
        if (fetchedOrgs) setOrganizations(fetchedOrgs);
    }, [fetchedOrgs]);

    useEffect(() => {
        if (fetchedAreas) setAvailableAreas(fetchedAreas);
    }, [fetchedAreas]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalCompanyId = currentUserRole === 'superadmin' ? formData.companyId : currentUserCompanyId;

            const userData = {
                email: formData.email,
                role: formData.role,
                companyId: finalCompanyId,
                assignedAreas: formData.role === 'punto_de_control' ? (formData.assignedAreas || []) : []
            };

            if (editingUser) {
                // Only include password if the admin typed a new one
                if (formData.password) userData.password = formData.password;
                await usersApi.update(editingUser.id, userData);
            } else {
                if (!formData.password) return alert('La contraseña es obligatoria.');
                await usersApi.create({ ...userData, password: formData.password });
            }
            refreshUsers();
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ email: '', password: '', role: 'recepcion', companyId: currentUserRole === 'superadmin' ? '' : currentUserCompanyId, assignedAreas: [] });
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

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${row.role === 'administrador' ? 'bg-navy text-white' :
                            row.role === 'superadmin' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}>
                            {row.role}
                        </span>
                    </div>
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
                    <button onClick={async () => {
                        try {
                            const freshUser = await usersApi.getById(row.id);
                            setEditingUser(freshUser);
                            setFormData({
                                email: freshUser.email,
                                password: '',
                                role: freshUser.role,
                                companyId: freshUser.companyId,
                                assignedAreas: freshUser.assignedAreas || []
                            });
                            setIsModalOpen(true);
                        } catch (err) {
                            alert('Error al cargar datos actualizados del usuario: ' + err.message);
                        }
                    }} className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                    <button onClick={async () => { if (confirm('¿Eliminar permisos?')) { await usersApi.delete(row.id); refreshUsers(); } }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Seguridad y Usuarios">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={15} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por email, rol o UID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-sm"
                        />
                    </div>
                    <button onClick={() => { setEditingUser(null); setFormData({ email: '', password: '', role: 'recepcion', companyId: currentUserRole === 'superadmin' ? '' : currentUserCompanyId, assignedAreas: [] }); setIsModalOpen(true); }} className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all justify-center">
                        <UserPlus size={16} /> Nuevo Usuario
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredUsers}
                    loading={loading}
                    emptyMessage="No se encontraron usuarios con esos criterios."
                />

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md my-8 rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Read-only ID display when editing */}
                                {editingUser && (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                        <Key size={13} className="text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID del Sistema</p>
                                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">{editingUser.id}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <input required type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        {editingUser ? 'Nueva Contraseña' : 'Contraseña'}
                                        {editingUser && <span className="ml-1 normal-case font-medium text-slate-300">(dejar vacío para no cambiar)</span>}
                                    </label>
                                    <input
                                        required={!editingUser}
                                        type="password"
                                        minLength={6}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm"
                                        placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
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
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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
