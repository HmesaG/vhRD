import React, { useEffect, useState } from 'react';
import { Cpu, Database, Zap, ShieldCheck } from 'lucide-react';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        if (onComplete) onComplete();
                    }, 250);
                    return 100;
                }
                const next = prev + (Math.random() * 20);
                return next >= 100 ? 100 : next;
            });
        }, 120);
        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-sm flex flex-col items-center space-y-12">
                {/* Logo Section */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse scale-150" />
                    <div className="w-32 h-32 sm:w-40 sm:h-40 relative transform hover:scale-105 transition-transform duration-700">
                        <img
                            src="/logo.png"
                            alt="Visitas Hub RD Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(245,130,32,0.4)]"
                        />
                    </div>
                </div>

                {/* Text Section */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter italic uppercase">
                        Visitas Hub <span className="text-primary italic">RD</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                        <p className="text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em]">
                            Vanguardia en Seguridad
                        </p>
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                    </div>
                </div>

                {/* Progress Loader */}
                <div className="w-48 space-y-4">
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-primary shadow-[0_0_15px_rgba(245,130,32,0.5)] transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Iniciando SDK...</span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Tech Stack Indicator (From About page data) */}
                <div className="pt-8 flex items-center gap-6 opacity-40">
                    <div className="flex flex-col items-center gap-2">
                        <Cpu size={16} className="text-blue-400" />
                        <span className="text-[8px] font-bold text-slate-400">React 19</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Database size={16} className="text-blue-300" />
                        <span className="text-[8px] font-bold text-slate-400">PostgreSQL</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Zap size={16} className="text-cyan-400" />
                        <span className="text-[8px] font-bold text-slate-400">Tailwind</span>
                    </div>
                </div>
            </div>

            {/* Bottom Credit */}
            <div className="absolute bottom-12 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-primary/60" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PROPIEDAD DE GMV</span>
                </div>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em]">© 2026 VISITAS HUB RD v2.1.0</p>
            </div>
        </div>
    );
};

export default SplashScreen;
