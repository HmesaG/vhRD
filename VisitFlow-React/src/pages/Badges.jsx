import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, where, serverTimestamp, updateDoc } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Trash2, IdCard, Search, QrCode, Edit2, X, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const Badges = () => {
    const { companyId } = useAuth();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ prefix: '', startNumber: '1', quantity: 1 });
    const [editNumber, setEditNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeVisitsMap, setActiveVisitsMap] = useState({});

    useEffect(() => {
        if (!companyId) return;

        const q = query(
            collection(db, 'badges'),
            where('companyId', '==', companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by number
            docs.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }));

            setBadges(docs);

            // Auto-suggest next number for the current prefix
            const currentPrefix = formData.prefix.toUpperCase().trim();
            const filteredNumbers = docs
                .filter(b => b.number.startsWith(currentPrefix))
                .map(b => {
                    const numPart = b.number.replace(currentPrefix, '');
                    return parseInt(numPart);
                })
                .filter(n => !isNaN(n));

            if (filteredNumbers.length > 0) {
                const next = Math.max(...filteredNumbers) + 1;
                setFormData(prev => ({ ...prev, startNumber: next.toString() }));
            } else {
                setFormData(prev => ({ ...prev, startNumber: '1' }));
            }
            setLoading(false);
        });

        // Track active visits to determine badge occupancy
        const qVisits = query(
            collection(db, 'visits'),
            where('companyId', '==', companyId)
        );
        const unsubscribeVisits = onSnapshot(qVisits, (snapshot) => {
            const map = {};
            snapshot.docs.forEach(d => {
                const data = d.data();
                if (!data.check_out && data.badge_number) {
                    map[data.badge_number] = data.full_name;
                }
            });
            setActiveVisitsMap(map);
        });

        return () => {
            unsubscribe();
            unsubscribeVisits();
        };
    }, [formData.prefix, companyId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        const start = parseInt(formData.startNumber);
        const qty = parseInt(formData.quantity);
        const prefix = formData.prefix.toUpperCase().trim();

        if (isNaN(start) || isNaN(qty) || qty < 1) {
            alert('Por favor, ingresa números válidos.');
            return;
        }

        if (!companyId) { alert("Error de sesión: Sin organización asignada."); return; }

        try {
            const batchPromises = [];
            for (let i = 0; i < qty; i++) {
                const numStr = (start + i).toString().padStart(3, '0');
                const fullBadgeLabel = `${prefix}${numStr}`;

                if (!badges.find(b => b.number === fullBadgeLabel)) {
                    batchPromises.push(addDoc(collection(db, 'badges'), {
                        number: fullBadgeLabel,
                        status: 'disponible',
                        created_at: serverTimestamp(),
                        companyId
                    }));
                }
            }

            if (batchPromises.length === 0) {
                alert('Los carnets con esta nomenclatura ya existen.');
                return;
            }

            await Promise.all(batchPromises);
            setFormData(prev => ({ ...prev, quantity: 1 }));
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editNumber.trim()) return;
        try {
            await updateDoc(doc(db, 'badges', editingId), { number: editNumber.toUpperCase().trim() });
            setIsEditing(false);
            setEditingId(null);
            setEditNumber('');
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (badge) => {
        setEditNumber(badge.number);
        setEditingId(badge.id);
        setIsEditing(true);
    };

    const handleShowQR = (value) => {
        setQrValue(value);
        setIsQRModalOpen(true);
    };

    const downloadQR = () => {
        const canvas = document.getElementById("badge-qr");
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_Badge_${qrValue}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este carnet permanentemente?')) {
            try { await deleteDoc(doc(db, 'badges', id)); }
            catch (err) { alert('Error: ' + err.message); }
        }
    };

    const filteredBadges = badges.filter(b => {
        const isOccupied = !!activeVisitsMap[b.number];
        const statusText = isOccupied ? 'ocupado' : 'en recepción';
        const visitorName = activeVisitsMap[b.number] || '';

        return b.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            statusText.includes(searchTerm.toLowerCase()) ||
            visitorName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const columns = [
        {
            header: 'Icono',
            className: 'w-16',
            render: () => (
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-900/20">
                    <IdCard size={18} />
                </div>
            )
        },
        {
            header: 'Identificación',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Carnet {row.number}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">Gafete de Seguridad</p>
                </div>
            )
        },
        {
            header: 'Estado de Inventario',
            render: (row) => {
                const visitorName = activeVisitsMap[row.number];
                const isOccupied = !!visitorName;
                return (
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${isOccupied ? 'text-red-500' : 'text-emerald-500'}`}>
                                {isOccupied ? 'Ocupado' : 'En Recepción'}
                            </p>
                            {isOccupied && (
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px]">
                                    {visitorName}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleShowQR(row.number)}
                        className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver Código QR"
                    >
                        <QrCode size={16} />
                    </button>
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
        <Layout title="Gestión de Carnets">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Search Header */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar carnet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner uppercase"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-4">Registro Masivo por Nomenclatura</h2>
                    <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Prefijo (Opcional)</label>
                            <input
                                type="text"
                                value={formData.prefix}
                                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner uppercase"
                                placeholder="Ej: V-"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Num. Inicial</label>
                            <input
                                type="number"
                                value={formData.startNumber}
                                onChange={(e) => setFormData({ ...formData, startNumber: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="1"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Cantidad</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary shadow-inner"
                                placeholder="10"
                                min="1"
                                required
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                Generar {formData.quantity > 0 ? `(${formData.quantity})` : ''}
                            </button>
                        </div>
                    </form>
                    <p className="mt-3 text-[10px] text-slate-400 italic">
                        * Ejemplo: Prefijo "V-" + Num "1" = <b>V-001</b>. Se evitarán duplicados existentes.
                    </p>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredBadges}
                    loading={loading}
                    emptyMessage="No hay carnets registrados."
                />

                {/* Edit Modal */}
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Editar Carnet</h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Identificación del Carnet</label>
                                    <input
                                        type="text"
                                        value={editNumber}
                                        onChange={(e) => setEditNumber(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary uppercase font-bold"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm">Actualizar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* QR Modal */}
                {isQRModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Código QR del Carnet</h3>
                                <button onClick={() => setIsQRModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-inner border border-slate-100 dark:border-slate-800 inline-block mb-6">
                                <QRCodeCanvas
                                    id="badge-qr"
                                    value={qrValue}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <p className="text-2xl font-black text-navy dark:text-primary mb-6 tracking-widest">{qrValue}</p>

                            <button
                                onClick={downloadQR}
                                className="w-full flex items-center justify-center gap-2 bg-navy dark:bg-primary text-white py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-xl shadow-navy/20 dark:shadow-primary/20"
                            >
                                <Download size={20} /> Descargar Imagen
                            </button>

                            <p className="mt-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest">VisitFlow Digital Badge System</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Badges;
