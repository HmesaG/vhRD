import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, where } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Printer, TrendingUp, Users, Building, Calendar, Download, Layers, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const Reports = () => {
    const { companyId } = useAuth();
    const [stats, setStats] = useState({ total: 0, avgTime: '---', active: 0, peakDay: '---' });
    const [visits, setVisits] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ranking, setRanking] = useState([]);
    const [timeFilter, setTimeFilter] = useState('30'); // days

    useEffect(() => {
        if (!companyId) return;

        const unsubs = [
            onSnapshot(query(collection(db, 'visits'), where('companyId', '==', companyId)), (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => {
                    const dateA = a.check_in?.toDate ? a.check_in.toDate() : new Date(0);
                    const dateB = b.check_in?.toDate ? b.check_in.toDate() : new Date(0);
                    return dateB - dateA;
                });
                setVisits(data);
                processData(data);
                setLoading(false);
            }),
            onSnapshot(query(collection(db, 'areas'), where('companyId', '==', companyId)), (snapshot) => {
                setAreas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            })
        ];

        return () => unsubs.forEach(unsub => unsub());
    }, [companyId]);

    const processData = (data) => {
        const finishedVisits = data.filter(v => v.check_out && v.check_in);
        let avgTime = '---';
        if (finishedVisits.length > 0) {
            const totalMs = finishedVisits.reduce((acc, v) => {
                const checkIn = v.check_in?.toDate ? v.check_in.toDate() : null;
                const checkOut = v.check_out?.toDate ? v.check_out.toDate() : null;
                if (checkIn && checkOut) return acc + (checkOut - checkIn);
                return acc;
            }, 0);
            const avgMins = Math.round((totalMs / finishedVisits.length) / 60000);
            avgTime = avgMins >= 60 ? `${Math.floor(avgMins / 60)}h ${avgMins % 60}m` : `${avgMins}m`;
        }

        // Company Ranking
        const counts = {};
        data.forEach(v => { if (v.company) counts[v.company] = (counts[v.company] || 0) + 1; });
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        setRanking(sorted);

        // Peak Day
        const dayCounts = {};
        data.forEach(v => {
            if (v.check_in?.toDate) {
                const key = v.check_in.toDate().toLocaleDateString('es-ES', { weekday: 'long' });
                dayCounts[key] = (dayCounts[key] || 0) + 1;
            }
        });
        const peakDay = Object.entries(dayCounts).length > 0
            ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
            : '---';

        setStats({
            total: data.length,
            avgTime,
            active: data.filter(v => !v.check_out).length,
            peakDay: peakDay.charAt(0).toUpperCase() + peakDay.slice(1)
        });
    };

    const getDailyData = () => {
        const days = parseInt(timeFilter);
        const labels = [];
        const counts = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            labels.push(key);
            counts[key] = 0;
        }
        visits.forEach(v => {
            if (v.check_in?.toDate) {
                const key = v.check_in.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                if (counts[key] !== undefined) counts[key]++;
            }
        });
        return {
            labels,
            datasets: [{
                label: 'Visitas',
                data: labels.map(l => counts[l]),
                borderColor: '#f58220',
                backgroundColor: 'rgba(245, 130, 32, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: days > 15 ? 0 : 4
            }]
        };
    };

    const getAreaStats = () => {
        const counts = {};
        visits.forEach(v => {
            if (v.areaId) {
                const area = areas.find(a => a.id === v.areaId);
                const name = area ? area.name : 'Desconocida';
                counts[name] = (counts[name] || 0) + 1;
            }
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return {
            labels: sorted.map(s => s[0]),
            datasets: [{
                label: 'Visitas por Área',
                data: sorted.map(s => s[1]),
                backgroundColor: '#003865',
                borderRadius: 8
            }]
        };
    };

    const getReasonDistribution = () => {
        const counts = {};
        visits.forEach(v => { if (v.reason) counts[v.reason] = (counts[v.reason] || 0) + 1; });
        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#f58220', '#003865', '#4ade80', '#fbbf24', '#f87171', '#818cf8', '#2dd4bf']
            }]
        };
    };

    const getHostRanking = () => {
        const counts = {};
        visits.forEach(v => { if (v.employee) counts[v.employee] = (counts[v.employee] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
        return {
            labels: sorted.map(s => s[0]),
            datasets: [{
                label: 'Visitas recibidas',
                data: sorted.map(s => s[1]),
                backgroundColor: 'rgba(245, 130, 32, 0.8)',
                borderRadius: 6
            }]
        };
    };

    const exportCSV = () => {
        const headers = ['Nombre', 'Cédula', 'Empresa', 'Empleado', 'Motivo', 'Área', 'Entrada', 'Salida', 'Estado'];
        const rows = visits.map(v => [
            v.full_name,
            v.document_id || 'N/A',
            v.company,
            v.employee,
            v.reason,
            areas.find(a => a.id === v.areaId)?.name || 'N/A',
            v.check_in?.toDate().toLocaleString() || '',
            v.check_out?.toDate().toLocaleString() || '',
            v.status
        ]);

        const content = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_Visitas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const rankingColumns = [
        {
            header: 'Empresa Visitante',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{row.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">Empresa Externa</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Visitas',
            render: (row) => <span className="text-sm font-black text-slate-700 dark:text-slate-300">{row.count}</span>
        },
        {
            header: 'Impacto Visual',
            render: (row) => {
                const perc = Math.min(((row.count / visits.length) * 100), 100).toFixed(1);
                return (
                    <div className="flex items-center gap-3 w-full max-w-[200px]">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-primary">{perc}%</span>
                    </div>
                );
            }
        }
    ];

    return (
        <Layout title="Centro de Reportes">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {[
                            { label: '7D', val: '7' },
                            { label: '15D', val: '15' },
                            { label: '30D', val: '30' }
                        ].map(f => (
                            <button
                                key={f.val}
                                onClick={() => setTimeFilter(f.val)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeFilter === f.val ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportCSV} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
                            <Download size={14} /> Exportar CSV
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                            <Printer size={14} /> Imprimir PDF
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatBox title="Total Visitas" value={stats.total} icon={<Users size={18} />} trend="+12% vs mes anterior" />
                    <StatBox title="Tiempo Promedio" value={stats.avgTime} icon={<Calendar size={18} />} trend="Estancia en planta" />
                    <StatBox title="Visitas Activas" value={stats.active} icon={<UserCheck size={18} />} color="text-green-500" trend="En este momento" />
                    <StatBox title="Día Pico" value={stats.peakDay} icon={<TrendingUp size={18} />} color="text-amber-500" trend="Mayor flujo" />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartCard title="Tendencia de Tráfico">
                        <Line
                            data={getDailyData()}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                            }}
                        />
                    </ChartCard>
                    <ChartCard title="Validaciones por Área">
                        <Bar
                            data={getAreaStats()}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { grid: { display: false } } }
                            }}
                        />
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ChartCard title="Motivos de Acceso" className="lg:col-span-1">
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut
                                data={getReasonDistribution()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '75%',
                                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9, weight: 'bold' }, padding: 15 } } }
                                }}
                            />
                        </div>
                    </ChartCard>
                    <ChartCard title="Top Empleados (Solicitados)" className="lg:col-span-2">
                        <Bar
                            data={getHostRanking()}
                            options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { grid: { display: false } } }
                            }}
                        />
                    </ChartCard>
                </div>

                {/* Detailed Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Building size={18} /></div>
                        <h3 className="font-bold text-slate-800 dark:text-white uppercase text-[11px] tracking-widest">Procedencia de Visitas</h3>
                    </div>
                    <DataTable
                        columns={rankingColumns}
                        data={ranking}
                        loading={loading}
                        emptyMessage="No hay datos suficientes para generar el ranking."
                    />
                </div>
            </div>
        </Layout>
    );
};

const StatBox = ({ title, value, icon, color = "text-primary", trend }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${color} shadow-inner`}>
                {icon}
            </div>
        </div>
        {trend && <p className="text-[10px] text-slate-400 font-bold mt-4 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300"></span> {trend}</p>}
    </div>
);

const ChartCard = ({ title, children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <h3 className="font-bold text-slate-800 dark:text-white mb-8 border-l-4 border-primary pl-3 uppercase text-[10px] tracking-widest flex items-center justify-between">
            {title}
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            </div>
        </h3>
        <div className="h-64 relative">
            {children}
        </div>
    </div>
);

export default Reports;
