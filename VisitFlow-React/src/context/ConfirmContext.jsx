import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmContext = createContext(null);

/**
 * Hook to imperatively open a confirm dialog.
 * Usage: const confirm = useConfirm();
 *        const ok = await confirm({ title: '...', message: '...' });
 */
export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return ctx;
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState(null); // { title, message, confirmLabel, danger, resolve }

    const confirm = useCallback(({ title = '¿Confirmar acción?', message = '', confirmLabel = 'Confirmar', danger = true } = {}) => {
        return new Promise((resolve) => {
            setState({ title, message, confirmLabel, danger, resolve });
        });
    }, []);

    const handleClose = (result) => {
        state?.resolve(result);
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && (
                <div
                    className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => handleClose(false)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 scale-100 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${state.danger ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {state.danger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
                        </div>

                        {/* Text */}
                        <div className="text-center space-y-1.5">
                            <h3 className="text-base font-bold text-white">{state.title}</h3>
                            {state.message && (
                                <p className="text-sm text-slate-400 leading-relaxed">{state.message}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleClose(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={15} />
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all active:scale-95 ${state.danger
                                    ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30'
                                    : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                                }`}
                            >
                                {state.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
