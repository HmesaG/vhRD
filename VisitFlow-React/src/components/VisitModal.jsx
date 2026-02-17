import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, onSnapshot, query, where, serverTimestamp } from '../firebase';
import { X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VisitModal = ({ isOpen, onClose }) => {
    const { companyId } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        document_id: '',
        company: '',
        reason: '',
        employee: '',
        badge_number: '',
        areaId: ''
    });
    const [companies, setCompanies] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [badges, setBadges] = useState([]);
    const [areas, setAreas] = useState([]);
    const [activeBadgeNumbers, setActiveBadgeNumbers] = useState([]);

    useEffect(() => {
        if (!isOpen) return;

        if (!companyId) {
            console.warn("VisitModal open but no companyId available");
            return;
        }

        const unsubs = [
            onSnapshot(query(collection(db, 'companies'), where('companyId', '==', companyId)), snap => {
                const data = snap.docs.map(d => d.data().name);
                data.sort((a, b) => a.localeCompare(b));
                setCompanies(data);
            }),
            onSnapshot(query(collection(db, 'reasons'), where('companyId', '==', companyId)), snap => {
                const data = snap.docs.map(d => ({
                    label: d.data().label,
                    requiresBadge: d.data().requiresBadge !== false
                }));
                data.sort((a, b) => a.label.localeCompare(b.label));
                setReasons(data);
            }),
            onSnapshot(query(collection(db, 'badges'), where('companyId', '==', companyId)), snap => {
                const data = snap.docs.map(d => d.data().number);
                data.sort();
                setBadges(data);
            }),
            onSnapshot(query(collection(db, 'visits'), where('companyId', '==', companyId)), snap => {
                const inUse = snap.docs
                    .filter(d => !d.data().check_out)
                    .map(d => d.data().badge_number)
                    .filter(Boolean);
                setActiveBadgeNumbers(inUse);
            }),
            onSnapshot(query(collection(db, 'employees'), where('companyId', '==', companyId)), snap => {
                const data = snap.docs.map(d => ({
                    name: d.data().name,
                    area: d.data().area,
                    email: d.data().email,
                    whatsapp: d.data().whatsapp
                }));
                data.sort((a, b) => a.name.localeCompare(b.name));
                setEmployees(data);
            }),
            onSnapshot(query(collection(db, 'areas'), where('companyId', '==', companyId)), snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                data.sort((a, b) => a.level.localeCompare(b.level, undefined, { numeric: true }));
                setAreas(data);
            })
        ];

        return () => unsubs.forEach(fn => fn());
    }, [isOpen, companyId]);

    const activeReason = reasons.find(r => r.label === formData.reason);
    const isBadgeRequired = formData.reason && activeReason ? activeReason.requiresBadge : false;
    const availableBadges = badges.filter(num => !activeBadgeNumbers.includes(num));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isBadgeRequired && !formData.badge_number) {
            alert('Por favor asigna un carnet para este motivo de visita.');
            return;
        }

        try {
            const selectedEmployee = employees.find(emp => emp.name === formData.employee);
            await addDoc(collection(db, 'visits'), {
                ...formData,
                companyId,
                photo_url: null,
                check_in: serverTimestamp(),
                status: 'Ingresado',
                visitor_phone: selectedEmployee?.whatsapp || '',
                visitor_email: selectedEmployee?.email || ''
            });
            onClose();
            setFormData({ full_name: '', document_id: '', company: '', reason: '', employee: '', badge_number: '', areaId: '' });
        } catch (err) { alert('Error: ' + err.message); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">Nueva Visita</h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Registro de Ingreso</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 lg:p-6 overflow-y-auto">
                    {(!companyId || (companies.length === 0 && reasons.length === 0)) && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">Datos no disponibles</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    {!companyId
                                        ? "Tu usuario no está asociado a ninguna empresa. Por favor recarga la página."
                                        : "No se encontraron empresas o motivos configurados."}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase ml-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase ml-1">Cédula / ID</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow font-mono"
                                    placeholder="Ej: 1-1234-5678"
                                    value={formData.document_id}
                                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Empresa</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Motivo</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                    value={formData.reason}
                                    onChange={(e) => {
                                        const newReason = e.target.value;
                                        const reasonObj = reasons.find(r => r.label === newReason);
                                        setFormData({
                                            ...formData,
                                            reason: newReason,
                                            badge_number: reasonObj?.requiresBadge === false ? '' : formData.badge_number
                                        });
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    {reasons.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Carnet Asignado</label>
                                <select
                                    required={isBadgeRequired}
                                    disabled={!formData.reason}
                                    className={`w-full px-4 py-3 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow ${!formData.reason ? 'bg-slate-100 dark:bg-slate-900/50 opacity-60 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800'}`}
                                    value={formData.badge_number}
                                    onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                                >
                                    {!formData.reason ? (
                                        <option value="">Elige motivo...</option>
                                    ) : (
                                        <>
                                            <option value="">{isBadgeRequired ? 'Seleccionar...' : 'No requerido'}</option>
                                            {availableBadges.map(num => <option key={num} value={num}>#{num}</option>)}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 text-primary font-black">Destino Autorizado</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-primary/5 dark:bg-primary/10 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow font-bold text-primary"
                                    value={formData.areaId}
                                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                                >
                                    <option value="" className="text-slate-500">Seleccionar Área / Nivel...</option>
                                    {areas.map(a => <option key={a.id} value={a.id} className="text-slate-800">{a.level} - {a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Empleado (Anfitrión)</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                    value={formData.employee}
                                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {employees.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 mt-4 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            Finalizar Registro de Entrada
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VisitModal;
