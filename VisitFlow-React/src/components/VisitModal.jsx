import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, onSnapshot, query, where, serverTimestamp } from '../firebase';
import { X, AlertTriangle, Camera, Scan, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

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
    const [isFetching, setIsFetching] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const html5QrCodeRef = React.useRef(null);

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

    useEffect(() => {
        const cleanId = formData.document_id.replace(/\D/g, '');
        if (cleanId.length === 11) {
            const fetchName = async () => {
                setIsFetching(true);
                try {
                    const response = await fetch(`https://cedula.jeshuatech.com/?cedula=${cleanId}`);
                    const result = await response.json();
                    if (result.success && result.data?.nombre_completo) {
                        setFormData(prev => ({
                            ...prev,
                            full_name: result.data.nombre_completo
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching cedula:", error);
                } finally {
                    setIsFetching(false);
                }
            };
            fetchName();
        }
    }, [formData.document_id]);

    const activeReason = reasons.find(r => r.label === formData.reason);
    const isBadgeRequired = formData.reason && activeReason ? activeReason.requiresBadge : false;
    const availableBadges = badges.filter(num => !activeBadgeNumbers.includes(num));

    const startScanner = async () => {
        try {
            setIsCameraActive(true);
            setTimeout(async () => {
                try {
                    const html5QrCode = new Html5Qrcode("modal-reader");
                    html5QrCodeRef.current = html5QrCode;
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            setFormData(prev => ({ ...prev, document_id: decodedText }));
                            stopScanner();
                        },
                        () => {}
                    );
                } catch (err) {
                    console.error(err);
                    setIsCameraActive(false);
                }
            }, 100);
        } catch (err) { setIsCameraActive(false); }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
            await html5QrCodeRef.current.clear();
        }
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) stopScanner();
        };
    }, []);

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden shadow-sm" />
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
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                                    {isFetching && <span className="text-[10px] text-primary animate-pulse font-bold uppercase">Consultando API...</span>}
                                </div>
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
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Cédula / ID</label>
                                    <button
                                        type="button"
                                        onClick={isCameraActive ? stopScanner : startScanner}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isCameraActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                                    >
                                        {isCameraActive ? <X size={12} /> : <Camera size={12} />}
                                        {isCameraActive ? 'Cerrar' : 'Escanear'}
                                    </button>
                                </div>
                                <div className="relative group">
                                    <input
                                        required
                                        type="text"
                                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-mono ${isFetching ? 'opacity-50' : ''}`}
                                        placeholder="Ej: 001-0000000-0"
                                        value={formData.document_id}
                                        onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Scan size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isCameraActive && (
                            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl animate-in zoom-in-95 duration-200">
                                <div id="modal-reader" className="w-full h-full" />
                                <div className="absolute inset-0 pointer-events-none border-[30px] border-slate-900/40">
                                    <div className="w-full h-full border border-primary/50 relative">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                                        <div className="w-full h-0.5 bg-primary/30 absolute top-0 animate-scan-line" />
                                    </div>
                                </div>
                            </div>
                        )}

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
