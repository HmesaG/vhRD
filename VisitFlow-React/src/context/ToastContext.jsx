import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const COLORS = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    info:    'bg-primary/10 border-primary/30 text-primary',
};

let _id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current[id]);
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, []);

    const toast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, message, type, leaving: false }]);
        timers.current[id] = setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    // Convenience methods
    toast.success = (msg, dur) => toast(msg, 'success', dur);
    toast.error   = (msg, dur) => toast(msg, 'error',   dur ?? 6000);
    toast.warning = (msg, dur) => toast(msg, 'warning', dur);
    toast.info    = (msg, dur) => toast(msg, 'info',    dur);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`
                            flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm
                            pointer-events-auto max-w-sm w-full
                            transition-all duration-300
                            ${COLORS[t.type]}
                            ${t.leaving
                                ? 'opacity-0 translate-x-full scale-95'
                                : 'opacity-100 translate-x-0 scale-100'}
                        `}
                        style={{ background: 'rgba(15,18,27,0.92)' }}
                    >
                        <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
                        <p className="flex-1 text-sm font-medium text-slate-200 leading-snug">{t.message}</p>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
};
